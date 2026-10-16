<?php

namespace App\Services\SPK;

class HybridEngineService
{
    protected $roc;
    protected $topsis;
    protected $capping;

    public function __construct(
        RocCalculatorService $roc,
        TopsisCalculatorService $topsis,
        CappingLogicService $capping
    ) {
        $this->roc = $roc;
        $this->topsis = $topsis;
        $this->capping = $capping;
    }

    /**
     * Mengeksekusi seluruh pipeline algoritma Hybrid ROC-TOPSIS
     */
    public function execute(array $warungs, int $totalStock, float $alpha = 1.0): array
    {
        $totalPermintaan = array_sum(array_column($warungs, 'requested_qty'));

        // BR-01: Kondisi Normal (Stok Melimpah)
        if ($totalStock >= $totalPermintaan) {
            $allocations = [];
            foreach ($warungs as $warung) {
                $allocations[$warung['id']] = $warung['requested_qty'];
            }
            return [
                'allocations' => $allocations,
                'topsis_scores' => [],
                'weights' => $this->roc->getWeights(),
            ];
        }

        // BR-02: Kondisi Undersupply -> Jalankan Mesin
        // 1. Dapatkan Bobot ROC
        $weights = $this->roc->getWeights();

        // 2. Format Input TOPSIS
        // C1 = Histori (Aktual Diterima / Diminta * 100). Default 100 jika baru (divisor = 0)
        // C2 = Status Pembayaran
        // C3 = Margin Kategori
        $topsisInput = [];
        foreach ($warungs as $w) {
            $c1 = ($w['history_requested'] > 0) 
                  ? ($w['history_received'] / $w['history_requested']) * 100 
                  : 100.0; 
            
            $topsisInput[] = [
                'id' => $w['id'],
                'C1' => $c1,
                'C2' => (float) $w['payment_status'],
                'C3' => (float) $w['margin_category'],
            ];
        }

        // 3. Jalankan TOPSIS untuk mendapatkan nilai Vi
        $topsisScores = $this->topsis->calculate($topsisInput, $weights);

        // 4. Masukkan ke Capping Logic (MGA, MG, Dynamic Capping)
        $finalAllocations = $this->capping->applyCapping($warungs, $totalStock, $alpha, $topsisScores);

        return [
            'allocations' => $finalAllocations,
            'topsis_scores' => $topsisScores,
            'weights' => $weights,
        ];
    }
}
