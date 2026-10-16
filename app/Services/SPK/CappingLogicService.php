<?php

namespace App\Services\SPK;

class CappingLogicService
{
    /**
     * Menerapkan pembatasan dan jaminan alokasi sesuai SRS Halaman 14
     */
    public function applyCapping(array $warungs, int $totalStock, float $alpha, array $topsisScores): array
    {
        $allocations = [];
        // Hanya hitung kebutuhan MG dari warung yang memiliki permintaan > 0
        $activeWarungsWithDemand = array_filter($warungs, fn($w) => ($w['requested_qty'] ?? 0) > 0);
        $totalMg = array_sum(array_map(fn($w) => min($w['mg_normal'], $w['requested_qty']), $activeWarungsWithDemand));

        // BR-08: Mode Alokasi Kritis
        if ($totalMg > $totalStock) {
            $totalMga = array_sum(array_map(fn($w) => min($w['mg_absolut'], $w['requested_qty']), $activeWarungsWithDemand));

            // Tahap 1: Jaminan Minimum Absolut
            foreach ($warungs as $warung) {
                if (($warung['requested_qty'] ?? 0) <= 0) {
                    $allocations[$warung['id']] = 0;
                    continue;
                }

                $mgaCap = min($warung['mg_absolut'], $warung['requested_qty']);
                if ($totalMga <= $totalStock) {
                    $allocations[$warung['id']] = $mgaCap;
                } else {
                    // Proporsional paling ekstrem dengan pengaman tidak melebihi stok
                    $allocations[$warung['id']] = (int) floor($mgaCap * ($totalStock / ($totalMga ?: 1)));
                }
            }

            // Tahap 2: Distribusi Sisa Stok Berbasis Prioritas TOPSIS
            $sisaKritis = $totalStock - array_sum($allocations);
            if ($sisaKritis > 0) {
                $allocations = $this->distributeRemainder($warungs, $allocations, $topsisScores, $sisaKritis, true);
            }

            return $allocations;
        }

        // Mode Undersupply Standar (Total MG <= Total Stok)
        // 1. Alokasi Dasar = min(MG, Permintaan)
        $sisaStok = $totalStock;
        foreach ($warungs as $warung) {
            $initialQuota = min($warung['mg_normal'], $warung['requested_qty'] ?? 0);
            $allocations[$warung['id']] = $initialQuota;
            $sisaStok -= $initialQuota;
        }

        // 2. Alokasikan Sisa Stok berbasis TOPSIS dengan batas atas Dynamic Capping
        $dcLimit = (int) round($alpha * $sisaStok);
        if ($sisaStok > 0) {
            $allocations = $this->distributeRemainder($warungs, $allocations, $topsisScores, $sisaStok, false, $dcLimit);
        }

        return $allocations;
    }

    /**
     * Distribusi proporsional menggunakan Largest Remainder Method (Hare-Niemeyer) Multi-Pass
     * Menjamin 100% sisa stok habis terbagi tanpa kebocoran stok atau over-allocation
     */
    private function distributeRemainder(array $warungs, array $allocations, array $topsisScores, int $sisaStok, bool $isCritical, int $dcLimit = 9999): array
    {
        $totalVi = array_sum($topsisScores) ?: 1;
        $fractions = [];
        $distributed = 0;

        foreach ($warungs as $warung) {
            $id = $warung['id'];
            if (($warung['requested_qty'] ?? 0) <= 0) {
                $fractions[$id] = 0.0;
                continue;
            }

            $vi = $topsisScores[$id] ?? 0;
            
            // Berapa hak tambahan tabung untuk warung ini
            $hakTambahanFloat = ($vi / $totalVi) * $sisaStok;
            $hakTambahan = (int) floor($hakTambahanFloat);
            $fractions[$id] = $hakTambahanFloat - $hakTambahan;

            // Batasi sesuai aturan (Sisa MG atau Permintaan, atau DC Limit)
            if ($isCritical) {
                $maxTambahan = min($warung['mg_normal'], $warung['requested_qty']) - $allocations[$id];
                $maxTambahan = max(0, $maxTambahan);
                $hakTambahan = min($hakTambahan, $maxTambahan);
            } else {
                $maxTambahan = min($warung['requested_qty'] - $allocations[$id], $dcLimit);
                $maxTambahan = max(0, $maxTambahan);
                $hakTambahan = min($hakTambahan, $maxTambahan);
            }

            $allocations[$id] += $hakTambahan;
            $distributed += $hakTambahan;
        }

        // Bagikan sisa stok yang belum terbagi secara berputar (multi-pass round-robin)
        $sisaBelumTerbagi = $sisaStok - $distributed;
        arsort($fractions);

        $warungMap = [];
        foreach ($warungs as $w) {
            $warungMap[$w['id']] = $w;
        }

        // Loop multi-pass hingga stok habis atau seluruh warung mencapai batas maksimum
        while ($sisaBelumTerbagi > 0) {
            $allocatedInPass = 0;

            foreach ($fractions as $id => $fraction) {
                if ($sisaBelumTerbagi <= 0) break;

                $warung = $warungMap[$id] ?? null;
                if (!$warung || ($warung['requested_qty'] ?? 0) <= 0) continue;

                if ($isCritical) {
                    $maxAllowable = min($warung['mg_normal'], $warung['requested_qty']);
                    if ($allocations[$id] < $maxAllowable) {
                        $allocations[$id]++;
                        $sisaBelumTerbagi--;
                        $allocatedInPass++;
                    }
                } else {
                    $maxAllowable = min($warung['requested_qty'], $warung['mg_normal'] + $dcLimit);
                    if ($allocations[$id] < $maxAllowable) {
                        $allocations[$id]++;
                        $sisaBelumTerbagi--;
                        $allocatedInPass++;
                    }
                }
            }

            // Jika dalam satu putaran penuh tidak ada satupun warung yang bisa menerima tambahan lagi
            if ($allocatedInPass === 0) {
                break;
            }
        }

        return $allocations;
    }
}
