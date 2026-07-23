import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { baiVietAPI } from '../services/api';

const categoryMap = {
  'Tin Tức Nông Sản': { label: 'Tin tức', icon: 'eco' },
  'Mẹo Bảo Quản': { label: 'Mẹo bảo quản', icon: 'inventory_2' },
};
const category = (name) => categoryMap[name] || { label: name || 'Khác', icon: 'article' };
const date = (value) => value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '';

export default function Articles() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 6;

  useEffect(() => {
    baiVietAPI.getAll('?limit=100').then((data) => setAll(data.items || [])).catch(() => setAll([])).finally(() => setLoading(false));
  }, []);

  const filtered = all;
  const featured = filtered[0];
  const items = filtered.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filtered.length / limit);
  const recent = all.filter((item) => item.ma_bai_viet !== featured?.ma_bai_viet).slice(0, 5);

  return <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-[1280px] px-6 pt-8">
      <nav className="mb-8 flex items-center gap-2 text-body-sm text-on-surface-variant"><Link to="/" className="hover:text-primary">Trang chủ</Link><span className="material-symbols-outlined text-base">chevron_right</span><span className="font-semibold text-primary">Tin tức</span></nav>
    </div>
    <div className="mx-auto max-w-[1280px] px-6 pb-16"><div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
      <section className="space-y-10 lg:col-span-8">
        {loading ? <div className="flex justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> : featured ? <>
          <Link to={`/articles/${featured.ma_bai_viet}`} className="group relative block overflow-hidden rounded-xl bg-surface-container-lowest shadow-lg">
            <div className="aspect-[16/9] overflow-hidden">{featured.hinh_anh ? <img src={featured.hinh_anh} alt={featured.tieu_de} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-emerald-50"><span className="material-symbols-outlined text-7xl text-primary/30">{category(featured.ten_danh_muc).icon}</span></div>}</div><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 p-6 text-white"><span className="mb-3 inline-block rounded-full bg-secondary px-4 py-1 text-xs font-bold">NỔI BẬT</span><h1 className="font-h2 text-2xl font-bold leading-tight md:text-3xl">{featured.tieu_de}</h1>{featured.tom_tat && <p className="mt-3 line-clamp-2 text-white/90">{featured.tom_tat}</p>}<span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold">Đọc tiếp <span className="material-symbols-outlined">arrow_forward</span></span></div>
          </Link>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{items.filter((item) => item.ma_bai_viet !== featured.ma_bai_viet).map((item) => <Link key={item.ma_bai_viet} to={`/articles/${item.ma_bai_viet}`} className="group overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm transition hover:shadow-md"><div className="aspect-video overflow-hidden">{item.hinh_anh ? <img src={item.hinh_anh} alt={item.tieu_de} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-emerald-50"><span className="material-symbols-outlined text-5xl text-primary/25">{category(item.ten_danh_muc).icon}</span></div>}</div><div className="p-5"><p className="mb-2 text-xs font-bold text-primary">{category(item.ten_danh_muc).label.toUpperCase()} <span className="mx-1 text-outline">•</span><span className="font-normal text-on-surface-variant">{date(item.ngay_tao)}</span></p><h2 className="font-h3 text-lg font-bold leading-snug text-on-surface group-hover:text-primary">{item.tieu_de}</h2>{item.tom_tat && <p className="mt-3 line-clamp-3 text-sm text-on-surface-variant">{item.tom_tat}</p>}</div></Link>)}</div>
          {totalPages > 1 && <nav className="flex justify-center gap-3 pt-4">{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} onClick={() => setPage(number)} className={`h-10 w-10 rounded-lg font-bold ${page === number ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant'}`}>{number}</button>)}</nav>}
        </> : <div className="py-24 text-center text-on-surface-variant">Chưa có bài viết nào.</div>}
      </section>
      <aside className="space-y-8 lg:col-span-4"><div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm"><h2 className="mb-6 border-b border-outline-variant pb-3 font-h3 text-xl font-bold text-primary">Bài viết mới</h2><div className="space-y-4">{recent.map((item) => <Link key={item.ma_bai_viet} to={`/articles/${item.ma_bai_viet}`} className="group flex gap-4"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-emerald-50">{item.hinh_anh && <img src={item.hinh_anh} alt="" className="h-full w-full object-cover" />}</div><div><h3 className="line-clamp-2 font-semibold text-on-surface group-hover:text-primary">{item.tieu_de}</h3><p className="mt-1 text-sm text-on-surface-variant">{date(item.ngay_tao)}</p></div></Link>)}</div></div></aside>
    </div></div>
  </div>;
}
