import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 py-8 relative overflow-hidden">
            {/* Background Decorative Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="flex flex-col items-center mb-6 text-center">
                    <Link href="/" className="inline-block hover:scale-105 transition-transform duration-200">
                        <ApplicationLogo className="text-white scale-110 mb-2" />
                    </Link>
                    <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mt-1">
                        Sistem Pendukung Keputusan Distribusi
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                        FTI Universitas Kristen Satya Wacana (UKSW)
                    </p>
                </div>

                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
                    {children}
                </div>

                <div className="text-center mt-6 text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} SPK LPG 3 Kg &bull; Hak Cipta Terdaftar DJKI Kemenkumham RI
                </div>
            </div>
        </div>
    );
}

