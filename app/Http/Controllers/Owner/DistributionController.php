<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Distribution;
use App\Models\DistributionDetail;
use App\Models\Warung;
use App\Services\SPK\HybridEngineService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\DistributionsExport;

class DistributionController extends Controller
{
    public function index()
    {
        if (auth()->user()->role === 'supir') {
            // Untuk Supir, kita hanya tampilkan manifes yang 'locked' atau 'completed' terbaru
            $activeManifest = Distribution::with(['details.warung'])->whereIn('status', ['locked', 'completed'])->latest('date')->first();
            return Inertia::render('Supir/Manifest', [
                'manifest' => $activeManifest
            ]);
        }

        // Untuk Owner, kembalikan halaman Dashboard utamanya beserta data tren pemenuhan PPH (FR-OWN-08)
        $distributions = Distribution::with('details')->latest()->paginate(10);

        // Agregasi tren pemenuhan historis pangkalan & warung
        $fulfillmentStats = Distribution::with('details')
            ->whereIn('status', ['locked', 'completed'])
            ->latest('date')
            ->take(7)
            ->get()
            ->reverse()
            ->map(function ($dist) {
                $totalRequested = $dist->details->sum('requested_qty');
                $totalFinal = $dist->details->sum('final_qty');
                $fulfillmentRate = $totalRequested > 0 ? round(($totalFinal / $totalRequested) * 100, 1) : 100;

                return [
                    'date' => date('d M', strtotime($dist->date)),
                    'full_date' => $dist->date,
                    'total_stock' => $dist->total_stock,
                    'total_requested' => $totalRequested,
                    'total_allocated' => $totalFinal,
                    'fulfillment_rate' => $fulfillmentRate,
                ];
            })->values();

        return Inertia::render('Dashboard', [
            'distributions' => $distributions,
            'fulfillment_stats' => $fulfillmentStats,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date|unique:distributions,date',
            'total_stock' => 'required|integer|min:1',
            'alpha_capping' => 'required|numeric|min:0.1|max:1.0',
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
        ]);

        $distribution = Distribution::create($request->only('date', 'total_stock', 'alpha_capping'));

        // Otomatis tarik semua warung aktif ke detail manifes hari ini berdasarkan hari yang dipilih
        $warungs = Warung::where('is_active', true)
            ->where('hari_distribusi', $request->hari)
            ->get();

        foreach ($warungs as $warung) {
            DistributionDetail::create([
                'distribution_id' => $distribution->id,
                'warung_id' => $warung->id,
                'requested_qty' => 0, 
                'recommended_qty' => 0,
                'final_qty' => 0,
            ]);
        }

        return redirect()->route('distributions.edit', $distribution->id);
    }

    public function edit(Distribution $distribution, HybridEngineService $engine)
    {
        $distribution->load('details.warung');
        // ponytail: inferred day from details to avoid DB migration. Upgrade path: add 'hari' column to 'distributions' table if mixed-day cycles are allowed.
        $hari_distribusi = $distribution->details->first()?->warung?->hari_distribusi;

        // Ambil skor TOPSIS dari session flash jika ada
        $topsis_scores = session('topsis_scores', []);

        // Fallback: Jika belum ada di session tapi sudah ada permintaan, hitung skor TOPSIS on-the-fly untuk transparansi visual (FR-OWN-05)
        if (empty($topsis_scores) && $distribution->details->sum('requested_qty') > 0) {
            $warungIds = $distribution->details->pluck('warung_id')->toArray();
            $historyStats = DistributionDetail::whereIn('warung_id', $warungIds)
                ->whereHas('distribution', fn($q) => $q->where('date', '<', $distribution->date)->whereIn('status', ['locked', 'completed']))
                ->selectRaw('warung_id, SUM(final_qty) as total_received, SUM(requested_qty) as total_requested')
                ->groupBy('warung_id')
                ->get()
                ->keyBy('warung_id');

            $warungsData = [];
            foreach ($distribution->details as $detail) {
                $warung = $detail->warung;
                $stat = $historyStats->get($warung->id);
                $warungsData[] = [
                    'id' => $detail->id,
                    'requested_qty' => (int) $detail->requested_qty,
                    'payment_status' => $warung->payment_status,
                    'margin_category' => $warung->margin_category,
                    'mg_normal' => $warung->mg_normal,
                    'mg_absolut' => $warung->mg_absolut,
                    'history_received' => $stat ? (int)$stat->total_received : 0,
                    'history_requested' => $stat ? (int)$stat->total_requested : 0,
                ];
            }

            $engineRes = $engine->execute($warungsData, $distribution->total_stock, $distribution->alpha_capping);
            $topsis_scores = $engineRes['topsis_scores'] ?? [];
        }

        return Inertia::render('Distribution/Workspace', [
            'distribution' => $distribution,
            'hari_distribusi' => $hari_distribusi,
            'topsis_scores' => $topsis_scores,
        ]);
    }

    public function calculate(Request $request, Distribution $distribution, HybridEngineService $engine)
    {
        if ($distribution->status !== 'draft') return back()->with('error', 'Manifes sudah dikunci.');

        $inputs = $request->validate([
            'details' => 'required|array',
            'details.*.id' => 'required|exists:distribution_details,id',
            'details.*.requested_qty' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($inputs, $distribution, $engine) {
            foreach ($inputs['details'] as $item) {
                DistributionDetail::where('id', $item['id'])->update(['requested_qty' => $item['requested_qty']]);
            }

            $distribution->refresh();
            $distribution->load('details.warung');

            // Optimasi N+1 Query: Hitung seluruh riwayat C1 sekaligus dalam 1 query agregasi
            $warungIds = $distribution->details->pluck('warung_id')->toArray();
            $historyStats = DistributionDetail::whereIn('warung_id', $warungIds)
                ->whereHas('distribution', fn($q) => $q->where('date', '<', $distribution->date)->whereIn('status', ['locked', 'completed']))
                ->selectRaw('warung_id, SUM(final_qty) as total_received, SUM(requested_qty) as total_requested')
                ->groupBy('warung_id')
                ->get()
                ->keyBy('warung_id');
            
            $warungsData = [];
            foreach ($distribution->details as $detail) {
                $warung = $detail->warung;
                $stat = $historyStats->get($warung->id);
                $historyReceived = $stat ? (int)$stat->total_received : 0;
                $historyRequested = $stat ? (int)$stat->total_requested : 0;

                $warungsData[] = [
                    'id' => $detail->id, 
                    'requested_qty' => (int) $detail->requested_qty,
                    'payment_status' => $warung->payment_status,
                    'margin_category' => $warung->margin_category,
                    'mg_normal' => $warung->mg_normal,
                    'mg_absolut' => $warung->mg_absolut,
                    'history_received' => $historyReceived,
                    'history_requested' => $historyRequested,
                ];
            }

            // Jalankan Engine ROC-TOPSIS
            $engineResult = $engine->execute($warungsData, $distribution->total_stock, $distribution->alpha_capping);
            $allocations = $engineResult['allocations'];

            foreach ($allocations as $detailId => $qty) {
                DistributionDetail::where('id', $detailId)->update([
                    'recommended_qty' => $qty,
                    'final_qty' => $qty // Default disamakan dengan rekomendasi sebelum di-override
                ]);
            }

            // Simpan skor TOPSIS sementara di session untuk dirender di UI
            session()->flash('topsis_scores', $engineResult['topsis_scores'] ?? []);
        });

        return back()->with('message', 'Perhitungan SPK Hybrid ROC-TOPSIS berhasil dijalankan.');
    }

    public function override(Request $request, Distribution $distribution)
    {
        if ($distribution->status !== 'draft') return back()->with('error', 'Manifes sudah dikunci.');

        $inputs = $request->validate([
            'details' => 'required|array',
            'details.*.id' => 'required|exists:distribution_details,id',
            'details.*.final_qty' => 'required|integer|min:0',
        ]);

        foreach ($inputs['details'] as $item) {
            DistributionDetail::where('id', $item['id'])->update(['final_qty' => $item['final_qty']]);
        }

        return back()->with('message', 'Override alokasi berhasil disimpan.');
    }

    public function lock(Distribution $distribution)
    {
        $totalFinal = $distribution->details()->sum('final_qty');
        if ($totalFinal > $distribution->total_stock) {
            return back()->with('error', "Total alokasi akhir ($totalFinal) melebihi stok agen ($distribution->total_stock).");
        }

        $distribution->update(['status' => 'locked']);
        return back()->with('message', 'Manifes berhasil dikunci dan siap untuk Supir.');
    }

    // --- REPORTING / EXPORT --- //

    public function exportPdf(Distribution $distribution)
    {
        $distribution->load('details.warung');
        $pdf = Pdf::loadView('pdf.manifest', compact('distribution'));
        return $pdf->download('Manifes_SPK_LPG_' . $distribution->date . '.pdf');
    }

    public function exportExcel()
    {
        return Excel::download(new DistributionsExport, 'Riwayat_Distribusi_SPK.xlsx');
    }

    // --- MODUL SUPIR --- //

    public function deliver(Request $request, DistributionDetail $detail)
    {
        if (auth()->user()->role !== 'supir') abort(403);

        $detail->update(['delivery_status' => 'delivered']);
        return back()->with('message', 'Status pengiriman berhasil diperbarui.');
    }

    public function completeManifest(Distribution $distribution)
    {
        if (auth()->user()->role !== 'supir') abort(403);

        $distribution->update(['status' => 'completed']);
        return back()->with('message', 'Manifes hari ini telah selesai dikerjakan.');
    }

    public function destroy(Distribution $distribution)
    {
        $distribution->delete();
        return back()->with('message', 'Riwayat distribusi berhasil dihapus.');
    }
}
