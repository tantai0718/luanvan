import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { baiVietAPI, categoryAPI } from '../services/api';
import { ChevronRight, ArrowRight, ArrowLeft, Leaf, Package, FileText, Search, ChevronUp } from 'lucide-react';

const categoryIcon = { 'Tin Tức Nông Sản': <Leaf size={16} />, 'Mẹo Bảo Quản': <Package size={16} /> };
const icon = (name) => categoryIcon[name] || <FileText size={16} />;
const date = (value) => value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '';

export default function Articles() {
  const [all, setAll] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCate, setActiveCate] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTop, setShowTop] = useState(false);
  const limit = 6;

  useEffect(() => {
    Promise.all([
      baiVietAPI.getAll('?limit=100'),
      categoryAPI.getAll(),
    ]).then(([articleData, catData]) => {
      setAll(articleData.items || []);
      const cats = (catData.categories || catData || []).filter(c => c.loai === 'bai_viet');
      setCategories(cats);
    }).catch(() => { setAll([]); setCategories([]); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [activeCate]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filtered = activeCate ? all.filter(i => String(i.madm) === String(activeCate)) : all;
  const featured = filtered[0];
  const items = filtered.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filtered.length / limit);
  const recent = all.filter((item) => item.ma_bai_viet !== featured?.ma_bai_viet).slice(0, 5);

  return <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-[1280px] px-6 pt-8">
      <nav className="mb-8 flex items-center gap-2 text-body text-text-secondary"><Link to="/" className="hover:text-primary">Trang chủ</Link><ChevronRight size={16} /><span className="font-semibold text-primary">Tin tức</span></nav>
    </div>
    <div className="mx-auto max-w-[1280px] px-6 pb-16">
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-3">
          <button onClick={() => setActiveCate('')}
            className={`px-5 py-2.5 rounded-full text-body font-bold transition-all ${!activeCate ? 'bg-primary text-white shadow-md' : 'bg-white border border-border text-text-secondary hover:border-primary hover:text-primary'}`}>
            Tất cả
          </button>
          {categories.map(c => (
            <button key={c.madm} onClick={() => setActiveCate(c.madm)}
              className={`px-5 py-2.5 rounded-full text-body font-bold transition-all flex items-center gap-2 ${String(activeCate) === String(c.madm) ? 'bg-primary text-white shadow-md' : 'bg-white border border-border text-text-secondary hover:border-primary hover:text-primary'}`}>
              {icon(c.ten_danh_muc)}
              {c.ten_danh_muc}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
      <section className="space-y-10 lg:col-span-8">
        {loading ? <div className="flex justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> : featured ? <>
          <Link to={`/articles/${featured.ma_bai_viet}`} className="group relative block overflow-hidden rounded-xl bg-card shadow-lg">
            <div className="aspect-[16/9] overflow-hidden">{featured.hinh_anh ? <img src={featured.hinh_anh} alt={featured.tieu_de} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-emerald-50"><FileText size={72} className="text-primary/30" /></div>}</div><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 p-6 text-white"><span className="mb-3 inline-block rounded-full bg-secondary px-4 py-1 text-xs font-bold">NỔI BẬT</span><h1 className="text-2xl font-bold leading-tight md:text-3xl">{featured.tieu_de}</h1>{featured.tom_tat && <p className="mt-3 line-clamp-2 text-white/90">{featured.tom_tat}</p>}<span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold">Đọc tiếp <ArrowRight size={16} /></span></div>
          </Link>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{items.filter((item) => item.ma_bai_viet !== featured.ma_bai_viet).map((item) => <Link key={item.ma_bai_viet} to={`/articles/${item.ma_bai_viet}`} className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:shadow-md"><div className="aspect-video overflow-hidden">{item.hinh_anh ? <img src={item.hinh_anh} alt={item.tieu_de} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-emerald-50"><FileText size={48} className="text-primary/25" /></div>}</div><div className="p-5"><p className="mb-2 text-xs font-bold text-primary">{(item.ten_danh_muc || 'Khác').toUpperCase()} <span className="mx-1 text-text-secondary">•</span><span className="font-normal text-text-secondary">{date(item.ngay_tao)}</span></p><h2 className="text-lg font-bold leading-snug text-text-primary group-hover:text-primary">{item.tieu_de}</h2>{item.tom_tat && <p className="mt-3 line-clamp-3 text-sm text-text-secondary">{item.tom_tat}</p>}</div></Link>)}</div>
          {totalPages > 1 && <nav className="flex justify-center gap-3 pt-4">{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} onClick={() => setPage(number)} className={`h-10 w-10 rounded-lg font-bold ${page === number ? 'bg-primary text-white' : 'border border-border text-text-secondary'}`}>{number}</button>)}</nav>}
        </> : <div className="py-24 text-center text-text-secondary">Chưa có bài viết nào.</div>}
      </section>
      <aside className="space-y-8 lg:col-span-4"><div className="rounded-xl border border-border bg-white p-6 shadow-sm"><h2 className="mb-6 border-b border-border pb-3 text-xl font-bold text-primary">Bài viết mới</h2><div className="space-y-4">{recent.map((item) => <Link key={item.ma_bai_viet} to={`/articles/${item.ma_bai_viet}`} className="group flex gap-4"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-emerald-50">{item.hinh_anh && <img src={item.hinh_anh} alt="" className="h-full w-full object-cover" />}</div><div><h3 className="line-clamp-2 font-semibold text-text-primary group-hover:text-primary">{item.tieu_de}</h3><p className="mt-1 text-sm text-text-secondary">{date(item.ngay_tao)}</p></div></Link>)}</div></div>
      <form onSubmit={(event) => event.preventDefault()} className="rounded-xl bg-background p-6">
        <h2 className="mb-4 text-xl font-bold text-text-primary">Tìm kiếm bài viết</h2>
        <label className="relative block"><span className="sr-only">Từ khóa tìm kiếm</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Nhập từ khóa..." className="w-full rounded-lg border-0 bg-card py-3 pl-11 pr-4 text-text-primary outline-none ring-0 transition focus:ring-2 focus:ring-primary" /><Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" /></label>
      </form>

      {recent.length > 0 && <section><h2 className="inline-block border-b-2 border-primary pb-1 text-xl font-bold text-text-primary">Tin liên quan</h2><div className="mt-5 space-y-5">{recent.filter((post) => !searchQuery || post.tieu_de.toLocaleLowerCase('vi-VN').includes(searchQuery.toLocaleLowerCase('vi-VN'))).map((post) => <Link key={post.ma_bai_viet} to={`/articles/${post.ma_bai_viet}`} className="group flex gap-4"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-background">{post.hinh_anh ? <img src={post.hinh_anh} alt={post.tieu_de} className="h-full w-full object-cover transition duration-300 group-hover:scale-110" /> : <FileText size={24} className="flex h-full items-center justify-center text-primary/30" />}</div><div className="min-w-0"><h3 className="line-clamp-2 font-semibold leading-6 text-text-primary transition-colors group-hover:text-primary">{post.tieu_de}</h3><p className="mt-1 text-sm text-text-secondary">{date(post.ngay_tao)}</p></div></Link>)}</div></section>}

      <section className="glass-card overflow-hidden rounded-xl p-6"><h2 className="text-xl font-bold text-primary">Nhận tin nông sản</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Cập nhật giá cả và mùa vụ mới nhất hàng tuần qua email của bạn.</p><form className="mt-4 space-y-2" onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Email của bạn" className="w-full rounded-lg border border-border bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary" /><button type="submit" className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90">Đăng ký ngay</button></form></section>
      </aside>
      </div>
    </div>

    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Lên đầu trang" className={`fixed bottom-8 right-8 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all ${showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-8 opacity-0'}`}><ChevronUp size={24} /></button>
  </div>;
}
