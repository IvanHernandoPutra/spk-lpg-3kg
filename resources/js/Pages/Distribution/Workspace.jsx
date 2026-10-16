import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import { useState } from 'react';

export default function Workspace({ distribution, hari_distribusi, topsis_scores: initialTopsisScores }) {
    const { flash } = usePage().props;
    const topsisScores = flash?.topsis_scores || initialTopsisScores || {};

    const formSpk = useForm({
        details: distribution.details.map(d => ({
            id: d.id,
            requested_qty: d.requested_qty
        }))
    });

    const formOverride = useForm({
        details: distribution.details.map(d => ({
            id: d.id,
            final_qty: d.final_qty
        }))
    });

    const lockForm = useForm();
    const isDraft = distribution.status === 'draft';

    // Kalkulasi Status Kritis (FR-OWN-14)
    const totalMgNormal = distribution.details.reduce((sum, d) => sum + (d.warung.mg_normal || 0), 0);
    const totalMgAbsolut = distribution.details.reduce((sum, d) => sum + (d.warung.mg_absolut || 0), 0);
    const isCriticalMode = totalMgNormal > distribution.total_stock;

    const totalFinalAllocated = formOverride.data.details.reduce((sum, item) => sum + Number(item.final_qty || 0), 0);
    const isOverAllocated = totalFinalAllocated > distribution.total_stock;
    const isUnderAllocated = totalFinalAllocated < distribution.total_stock;

    const handleCalculate = (e) => {
        e.preventDefault();
        formSpk.post(route('distributions.calculate', distribution.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                // Update local formOverride state with newly calculated recommended_qty
                if (page.props.distribution?.details) {
                    formOverride.setData('details', page.props.distribution.details.map(d => ({
                        id: d.id,
                        final_qty: d.final_qty || d.recommended_qty
                    })));
                }
            }
        });
    };

    const handleOverride = (e) => {
        e.preventDefault();
        formOverride.post(route('distributions.override', distribution.id), {
            preserveScroll: true,
        });
    };

    const handleLock = () => {
        if (confirm('Kunci manifes ini? Anda tidak akan bisa mengubah angka alokasi lagi.')) {
            lockForm.post(route('distributions.lock', distribution.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="font-extrabold text-2xl text-slate-800 leading-tight flex items-center gap-2">
                            Workspace Alokasi SPK
                            <span className="text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-lg">
                                {new Date(distribution.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </h2>
                        {hari_distribusi && (
                            <p className="text-xs font-semibold text-slate-500 mt-1">
                                Siklus Pengiriman Hari: <span className="text-indigo-600 font-bold">{hari_distribusi}</span> ({distribution.details.length} Warung Terdaftar)
                            </p>
                        )}
                    </div>
                    <Link href={route('dashboard')} className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                        &larr; Kembali ke Dashboard
                    </Link>
                </div>
            }
        >
            <Head title="SPK Workspace - Penentuan Kuota Alokasi" />

            <div className="py-8 max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                {/* FR-OWN-14: Banner Notifikasi Mode Alokasi Kritis */}
                {isCriticalMode && (
                    <div className="bg-red-500 text-white rounded-2xl p-5 shadow-xl shadow-red-500/20 border-2 border-red-400 flex items-start gap-4 animate-pulse">
                        <div className="p-3 bg-white/20 rounded-xl shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="bg-white text-red-700 font-black text-xs uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                                    PERINGATAN SISTEM (FR-OWN-14)
                                </span>
                                <h3 className="text-lg font-black tracking-tight">MODE ALOKASI KRITIS DIAKTIFKAN</h3>
                            </div>
                            <p className="text-sm text-red-100 mt-1 leading-relaxed">
                                Total batas Minimum Guarantee Normal warung (<strong>{totalMgNormal} tabung</strong>) melampaui pasokan pangkalan (<strong>{distribution.total_stock} tabung</strong>).
                                Sistem secara otomatis menurunkan batas jatah ke <strong>Minimum Guarantee Absolut (MGA = {totalMgAbsolut} tabung)</strong> untuk mencegah kelangkaan ekstrem.
                            </p>
                        </div>
                    </div>
                )}

                {/* Metric Summary Bar */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full md:w-auto">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stok Pangkalan (S)</p>
                            <p className="text-2xl font-black text-slate-800">{distribution.total_stock} <span className="text-sm font-semibold text-slate-400">Tbg</span></p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Alpha Capping (α)</p>
                            <p className="text-2xl font-black text-indigo-600">{distribution.alpha_capping}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Alokasi Final</p>
                            <p className={`text-2xl font-black ${isOverAllocated ? 'text-red-600' : isUnderAllocated ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {totalFinalAllocated} <span className="text-sm font-semibold text-slate-400">/ {distribution.total_stock}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status Manifes</p>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                isDraft ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                                {distribution.status}
                            </span>
                        </div>
                    </div>

                    {isDraft && (
                        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <DangerButton 
                                onClick={handleLock} 
                                disabled={lockForm.processing || isOverAllocated}
                                className={`h-11 px-6 shadow-lg text-sm font-bold ${isOverAllocated ? 'opacity-50 cursor-not-allowed' : 'shadow-red-500/25'}`}
                            >
                                Kunci Manifes Final &rarr;
                            </DangerButton>
                        </div>
                    )}
                </div>

                {isOverAllocated && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Peringatan Budget: Total alokasi ({totalFinalAllocated} tabung) melebihi stok pangkalan ({distribution.total_stock} tabung). Manifes tidak dapat dikunci.
                    </div>
                )}

                {/* Two Column Workflow Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* PANEL 1: Input Permintaan Harian */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black">1</span>
                                <h3 className="font-bold text-sm tracking-tight">Input Permintaan Harian</h3>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">FR-OWN-04</span>
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                            <form onSubmit={handleCalculate} className="flex-1 flex flex-col">
                                <div className="flex-1 overflow-y-auto space-y-3 max-h-[520px] pr-1">
                                    {distribution.details.map((detail, index) => (
                                        <div key={detail.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition-colors">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                        WRG-{String(detail.warung_id).padStart(3, '0')}
                                                    </span>
                                                    <p className="font-bold text-slate-800 text-sm truncate" title={detail.warung.name}>
                                                        {detail.warung.name}
                                                    </p>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    MG: <strong className="text-slate-700">{detail.warung.mg_normal}</strong> | MGA: <strong className="text-slate-700">{detail.warung.mg_absolut}</strong> | Bayar: <span className="capitalize">{detail.warung.payment_status === 3 ? 'Lancar' : detail.warung.payment_status === 2 ? 'Krg Lancar' : 'Macet'}</span>
                                                </p>
                                            </div>
                                            <div className="w-24 shrink-0 text-right">
                                                <label className="text-[10px] text-slate-400 font-bold block mb-1">Minta (Tbg)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    disabled={!isDraft}
                                                    className="w-full text-center font-bold text-sm border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg py-1.5 px-2 bg-white"
                                                    value={formSpk.data.details[index].requested_qty}
                                                    onChange={e => {
                                                        const newDetails = [...formSpk.data.details];
                                                        newDetails[index].requested_qty = e.target.value;
                                                        formSpk.setData('details', newDetails);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {isDraft && (
                                    <PrimaryButton disabled={formSpk.processing} className="w-full mt-4 justify-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 text-sm">
                                        {formSpk.processing ? 'Menghitung ROC-TOPSIS...' : 'Jalankan Engine Hybrid ROC-TOPSIS'}
                                    </PrimaryButton>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* PANEL 2: Rekomendasi SPK & Intervensi Override */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-white text-indigo-700 flex items-center justify-center text-xs font-black">2</span>
                                <h3 className="font-bold text-sm tracking-tight">Hasil Komputasi SPK & Override Manual</h3>
                            </div>
                            <span className="text-xs text-indigo-200 font-mono">FR-OWN-05 & 06</span>
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                            <form onSubmit={handleOverride} className="flex-1 flex flex-col">
                                <div className="flex-1 overflow-y-auto max-h-[520px] pr-1">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                <th className="py-2.5 px-2">Warung</th>
                                                <th className="py-2.5 px-2 text-center" title="Skor Kedekatan Relatif TOPSIS (0 - 1)">Skor TOPSIS (Vi)</th>
                                                <th className="py-2.5 px-2 text-center" title="Rekomendasi Algoritma SPK">Rek. SPK</th>
                                                <th className="py-2.5 px-2 text-center w-28">Final / Override</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {distribution.details.map((detail, index) => {
                                                const viScore = topsisScores[detail.id] !== undefined ? Number(topsisScores[detail.id]).toFixed(4) : '-';
                                                const isDifferent = Number(formOverride.data.details[index].final_qty) !== Number(detail.recommended_qty);

                                                return (
                                                    <tr key={detail.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-2.5 px-2">
                                                            <p className="font-bold text-slate-800 text-xs truncate max-w-[150px]" title={detail.warung.name}>
                                                                {detail.warung.name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">
                                                                Minta: <strong className="text-slate-600">{detail.requested_qty}</strong>
                                                            </p>
                                                        </td>
                                                        <td className="py-2.5 px-2 text-center">
                                                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded">
                                                                {viScore}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-2 text-center">
                                                            <span className="inline-flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                                                                {detail.recommended_qty} Tbg
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-2 text-center">
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    disabled={!isDraft}
                                                                    className={`w-full text-center font-black text-sm rounded-lg py-1.5 px-2 border transition-all ${
                                                                        isDifferent 
                                                                            ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-500' 
                                                                            : 'border-slate-300 bg-white text-slate-800 focus:ring-indigo-500'
                                                                    }`}
                                                                    value={formOverride.data.details[index].final_qty}
                                                                    onChange={e => {
                                                                        const newDetails = [...formOverride.data.details];
                                                                        newDetails[index].final_qty = e.target.value;
                                                                        formOverride.setData('details', newDetails);
                                                                    }}
                                                                />
                                                                {isDifferent && (
                                                                    <span className="absolute -top-2 right-1 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-full uppercase">
                                                                        Modif
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Total Alokasi Final</p>
                                        <p className="text-xs text-slate-400">Harus &le; {distribution.total_stock} Tabung</p>
                                    </div>
                                    <div className={`text-2xl font-black ${isOverAllocated ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {totalFinalAllocated} <span className="text-sm font-bold text-slate-400">Tabung</span>
                                    </div>
                                </div>

                                {isDraft && (
                                    <button
                                        type="submit"
                                        disabled={formOverride.processing || isOverAllocated}
                                        className="mt-3 w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
                                    >
                                        {formOverride.processing ? 'Menyimpan...' : 'Simpan Intervensi Override Manual'}
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}

