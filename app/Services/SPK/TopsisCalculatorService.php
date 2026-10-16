<?php

namespace App\Services\SPK;

class TopsisCalculatorService
{
    /**
     * Menjalankan algoritma TOPSIS
     * @param array $alternatives Data warung dengan nilai kriteria awal ['id', 'C1', 'C2', 'C3']
     * @param array $weights Bobot dari ROC ['C1', 'C2', 'C3']
     * @return array Alternatif beserta nilai preferensi Vi
     */
    public function calculate(array $alternatives, array $weights): array
    {
        if (empty($alternatives)) return [];

        // 1. Matriks Normalisasi (R)
        $divisors = ['C1' => 0, 'C2' => 0, 'C3' => 0];
        foreach ($alternatives as $alt) {
            $divisors['C1'] += pow($alt['C1'], 2);
            $divisors['C2'] += pow($alt['C2'], 2);
            $divisors['C3'] += pow($alt['C3'], 2);
        }

        $divisors = [
            'C1' => sqrt($divisors['C1']) ?: 1, // Hindari division by zero
            'C2' => sqrt($divisors['C2']) ?: 1,
            'C3' => sqrt($divisors['C3']) ?: 1,
        ];

        // 2. Matriks Normalisasi Terbobot (V)
        $vMatrix = [];
        foreach ($alternatives as $alt) {
            $vMatrix[$alt['id']] = [
                'C1' => ($alt['C1'] / $divisors['C1']) * $weights['C1'],
                'C2' => ($alt['C2'] / $divisors['C2']) * $weights['C2'],
                'C3' => ($alt['C3'] / $divisors['C3']) * $weights['C3'],
            ];
        }

        // 3. Solusi Ideal Positif (A+) & Negatif (A-)
        // Sifat: C1 = Cost, C2 = Benefit, C3 = Benefit
        $aPlus = [
            'C1' => min(array_column($vMatrix, 'C1') ?: [0]),
            'C2' => max(array_column($vMatrix, 'C2') ?: [0]),
            'C3' => max(array_column($vMatrix, 'C3') ?: [0]),
        ];

        $aMinus = [
            'C1' => max(array_column($vMatrix, 'C1') ?: [0]),
            'C2' => min(array_column($vMatrix, 'C2') ?: [0]),
            'C3' => min(array_column($vMatrix, 'C3') ?: [0]),
        ];

        // 4. Jarak Solusi Ideal & Nilai Preferensi (Vi)
        $results = [];
        foreach ($alternatives as $idx => $alt) {
            $id = $alt['id'];
            $v = $vMatrix[$id];

            $dPlus = sqrt(
                pow($aPlus['C1'] - $v['C1'], 2) +
                pow($aPlus['C2'] - $v['C2'], 2) +
                pow($aPlus['C3'] - $v['C3'], 2)
            );

            $dMinus = sqrt(
                pow($aMinus['C1'] - $v['C1'], 2) +
                pow($aMinus['C2'] - $v['C2'], 2) +
                pow($aMinus['C3'] - $v['C3'], 2)
            );

            $distanceSum = $dPlus + $dMinus;
            // Jika semua alternatif identik, beri nilai preferensi merata (1 / N) bukan 0
            $vi = ($distanceSum == 0) ? (1.0 / count($alternatives)) : ($dMinus / $distanceSum);

            $results[$id] = round($vi, 4);
        }

        return $results;
    }
}
