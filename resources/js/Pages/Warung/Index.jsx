import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ warungs, filters }) {
    const { delete: destroy } = useForm();
    const [search, setSearch] = useState(filters?.search || '');
    const [hariDistribusi, setHariDistribusi] = useState(filters?.hari_distribusi || '');
    const [showAllCols, setShowAllCols] = useState(false);

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus warung ini?')) {
            destroy(route('warungs.destroy', id));
        }
    };

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('warungs.index'), { search, hari_distribusi: hariDistribusi }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Master Warung</h2>}
        >
            <Head title="Mitra Warung" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Main Card */}
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8 flex flex-col gap-6">
                        
                        {/* Toolbar & Title */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-900">Daftar Mitra Warung</h3>
                            <Link href={route('warungs.create')}>
                                <button className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Tambah Warung
                                </button>
                            </Link>
                        </div>

                        {/* Filters */}
                        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1 max-w-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Cari nama warung..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all shadow-sm"
                                />
                            </div>
                            <div className="flex gap-3">
                                <select 
                                    value={hariDistribusi} 
                                    onChange={e => setHariDistribusi(e.target.value)}
                                    className="px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none min-w-[140px] shadow-sm cursor-pointer"
                                >
                                    <option value="">Semua Hari</option>
                                    <option value="Senin">Senin</option>
                                    <option value="Selasa">Selasa</option>
                                    <option value="Rabu">Rabu</option>
                                    <option value="Kamis">Kamis</option>
                                    <option value="Jumat">Jumat</option>
                                    <option value="Sabtu">Sabtu</option>
                                    <option value="Minggu">Minggu</option>
                                </select>
                                <button type="submit" className="bg-gray-900 text-white hover:bg-gray-800 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                                    Filter
                                </button>
                            </div>
                        </form>

                        {/* Table */}
                        <div className="flex justify-end md:hidden mb-2">
                            <button onClick={() => setShowAllCols(!showAllCols)} className="text-sm text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">{showAllCols ? 'Ringkas Tabel' : 'Buka Semua Kolom'}</button>
                        </div>
                        {/* ponytail: CSS grid/card rewrite skipped. Native horizontal scroll is responsive. */}
                        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                        <th className="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Warung</th>
                                        <th className="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Warung</th>
                                        <th className={`py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${showAllCols ? '' : 'hidden md:table-cell'}`}>Hari Distribusi</th>
                                        <th className={`py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${showAllCols ? '' : 'hidden md:table-cell'}`}>Alamat</th>
                                        <th className="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className={`py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${showAllCols ? '' : 'hidden md:table-cell'}`}>Kategori (Margin)</th>
                                        <th className={`py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${showAllCols ? '' : 'hidden md:table-cell'}`}>Pembayaran</th>
                                        <th className={`py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${showAllCols ? '' : 'hidden md:table-cell'}`}>MG / MGA</th>
                                        <th className="py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {warungs.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="py-8 px-5 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                    <p>Belum ada data warung.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        warungs.data.map((warung) => (
                                            <tr key={warung.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-5 text-xs font-mono font-bold text-indigo-600 whitespace-nowrap">
                                                    WRG-{String(warung.id).padStart(3, '0')}
                                                </td>
                                                <td className="py-4 px-5 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                    {warung.name}
                                                </td>
                                                <td className={`py-4 px-5 text-sm text-gray-500 ${showAllCols ? '' : 'hidden md:table-cell'}`}>{warung.hari_distribusi || '-'}</td>
                                                <td className={`py-4 px-5 text-sm text-gray-500 max-w-[200px] truncate ${showAllCols ? '' : 'hidden md:table-cell'}`} title={warung.address}>{warung.address || '-'}</td>
                                                <td className="py-4 px-5">
                                                    {warung.is_active ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">Aktif</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-red-700 ring-1 ring-red-600/20">Tidak Aktif</span>
                                                    )}
                                                </td>
                                                <td className={`py-4 px-5 text-sm text-gray-500 ${showAllCols ? '' : 'hidden md:table-cell'}`}>
                                                    {warung.margin_category === 3 ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700">Margin Tinggi</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700">Margin Rendah</span>
                                                    )}
                                                </td>
                                                <td className={`py-4 px-5 ${showAllCols ? '' : 'hidden md:table-cell'}`}>
                                                    {warung.payment_status === 3 ? (
                                                        <span className="text-sm text-emerald-600 font-medium">Lancar</span>
                                                    ) : warung.payment_status === 2 ? (
                                                        <span className="text-sm text-amber-600 font-medium">Kurang Lancar</span>
                                                    ) : (
                                                        <span className="text-sm text-red-600 font-medium">Tidak Lancar</span>
                                                    )}
                                                </td>
                                                <td className={`py-4 px-5 text-sm font-semibold text-indigo-600 ${showAllCols ? '' : 'hidden md:table-cell'}`}>{warung.mg_normal} / {warung.mg_absolut}</td>
                                                <td className="py-4 px-5 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        <Link href={route('warungs.edit', warung.id)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors">Edit</Link>
                                                        <button 
                                                            onClick={() => handleDelete(warung.id)}
                                                            className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        <div className="mt-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-sm text-gray-500">
                                Menampilkan {warungs.from || 0} sampai {warungs.to || 0} dari {warungs.total} entri
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {warungs.links.map((link, index) => (
                                    <Link 
                                        key={index} 
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                            link.active 
                                                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20' 
                                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                                        } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
