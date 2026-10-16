import { Head, useForm, Link } from '@inertiajs/react';

export default function Manifest({ manifest }) {
    const { post: postDeliver } = useForm();
    const { post: postComplete, processing } = useForm();

    const handleDeliver = (detailId) => {
        postDeliver(route('distributions.deliver', detailId), {
            preserveScroll: true
        });
    };

    const handleComplete = () => {
        if(confirm('Akhiri pengiriman hari ini? Pastikan semua tabung sudah diturunkan.')) {
            postComplete(route('distributions.complete', manifest.id));
        }
    };

    if (!manifest) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <Head title="Manifes Kosong" />
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Belum Ada Manifes</h2>
                    <p className="text-slate-500 mb-8">Owner belum mengunci data distribusi hari ini. Silakan beristirahat sejenak.</p>
                    <Link href={route('logout')} method="post" as="button" className="w-full font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 py-3 rounded-xl transition-colors">
                        Keluar Aplikasi
                    </Link>
                </div>
            </div>
        );
    }

    const isCompleted = manifest.status === 'completed';
    const totalTabung = manifest.details.reduce((sum, d) => sum + d.final_qty, 0);
    const totalTerkirim = manifest.details.filter(d => d.delivery_status === 'delivered').length;
    const progressPercent = manifest.details.length > 0 ? Math.round((totalTerkirim / manifest.details.length) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-100 flex justify-center">
            <Head title="Manifes Pengiriman" />

            {/* Mobile App Container Wrapper for Desktop friendliness */}
            <div className="w-full max-w-md bg-slate-50 min-h-screen relative shadow-2xl overflow-hidden pb-32">
                
                {/* Header Section */}
                <div className="bg-brand-600 rounded-b-[2.5rem] pt-8 pb-16 px-6 shadow-md relative z-10">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-48 h-48">
                          <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
                          <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <div className="flex justify-between items-center mb-8 relative z-20">
                        <h1 className="text-2xl font-black text-white tracking-tight">Manifes Harian</h1>
                        <Link href={route('logout')} method="post" as="button" className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md hover:bg-white/30 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                        </Link>
                    </div>
                    
                    <div className="relative z-20">
                        <p className="text-brand-100 font-medium text-sm mb-1">
                            {new Date(manifest.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-white text-5xl font-black">{totalTabung} <span className="text-xl font-medium text-brand-200">Tbg</span></p>
                    </div>
                </div>

                {/* Main Content List */}
                <div className="px-4 -mt-10 relative z-20 space-y-4">
                    {manifest.details.filter(d => d.final_qty > 0).map((detail) => (
                        <div key={detail.id} className={`bg-white rounded-3xl p-5 shadow-sm border ${detail.delivery_status === 'delivered' ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'} transition-all`}>
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 pr-4">
                                    <h3 className={`text-xl font-black tracking-tight leading-tight ${detail.delivery_status === 'delivered' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                        {detail.warung.name}
                                    </h3>
                                    <p className="text-slate-500 text-xs mt-1.5 flex items-start gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0 text-slate-400">
                                          <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.345-.871 2.053-1.444C14.86 15.748 18 12.544 18 8.5a8 8 0 10-16 0c0 4.044 3.14 7.248 4.577 8.412.708.573 1.433 1.06 2.053 1.444a23.868 23.868 0 00.757.433 5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.25a2.75 2.75 0 100-5.5 2.75 2.75 0 000 5.5z" clipRule="evenodd" />
                                        </svg>
                                        <span className="leading-tight">{detail.warung.address || 'Alamat tidak tersedia'}</span>
                                    </p>

                                    {/* Action Buttons: Phone & Maps (FR-SPR-02) */}
                                    <div className="flex items-center gap-2 mt-3">
                                        {detail.warung.phone && (
                                            <a 
                                                href={`tel:${detail.warung.phone}`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 4V3z" />
                                                </svg>
                                                {detail.warung.phone}
                                            </a>
                                        )}
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.warung.name + ' ' + (detail.warung.address || ''))}`}
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            Peta Lokasi
                                        </a>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 text-emerald-800 font-black text-3xl px-4 py-2.5 rounded-2xl border border-emerald-200 shrink-0 text-center">
                                    {detail.final_qty}
                                    <span className="block text-[10px] font-bold text-emerald-600 uppercase">Tabung</span>
                                </div>
                            </div>

                            {detail.delivery_status === 'pending' ? (
                                <button 
                                    onClick={() => handleDeliver(detail.id)}
                                    disabled={isCompleted}
                                    className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-900 active:scale-95 transition-all shadow-md shadow-slate-300"
                                >
                                    <div className="w-5 h-5 border-2 border-white rounded-full"></div>
                                    Tandai Selesai Turun
                                </button>
                            ) : (
                                <div className="w-full bg-emerald-100 text-emerald-800 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-emerald-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                    </svg>
                                    Tabung Sudah Turun
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bottom Action Bar (Fixed to the mobile wrapper width) */}
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-5 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50">
                    {!isCompleted ? (
                        <button 
                            onClick={handleComplete}
                            disabled={processing || progressPercent < 100}
                            className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
                                progressPercent === 100 
                                    ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 active:scale-95' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            Akhiri Pengiriman Hari Ini
                        </button>
                    ) : (
                        <div className="w-full py-4 rounded-2xl font-black text-lg bg-emerald-500 text-white text-center shadow-lg">
                            Selesai! Terima Kasih.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
