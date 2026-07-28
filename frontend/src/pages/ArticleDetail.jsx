import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { baiVietAPI } from '../services/api';
import { ChevronRight, ArrowLeft, Search, FileText, ChevronUp, Leaf, Package } from 'lucide-react';

const categoryInfo = {
  'Tin Tức Nông Sản': { label: 'Tin tức', icon: <Leaf size={15} />, tone: 'bg-emerald-50 text-emerald-700' },
  'Mẹo Bảo Quản': { label: 'Mẹo bảo quản', icon: <Package size={15} />, tone: 'bg-blue-50 text-blue-700' },
};

const getCategory = (name) => categoryInfo[name] || { label: name || 'Khác', icon: <FileText size={15} />, tone: 'bg-slate-100 text-slate-700' };

function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

export default function ArticleDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([baiVietAPI.getById(id), baiVietAPI.getAll('?limit=8')])
      .then(([article, list]) => {
        setItem(article);
        setRelated((list.items || []).filter((post) => String(post.ma_bai_viet) !== String(id)).slice(0, 3));
      })
      .catch((err) => setError(err.message || 'Không tìm thấy bài viết'))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-5"><FileText size={72} className="text-primary/20" /><p className="text-lg text-danger">{error}</p><Link to="/articles" className="font-bold text-primary hover:underline">Quay lại trang tin tức</Link></div>;
  if (!item) return null;

  const category = getCategory(item.ten_danh_muc);

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-[1280px] px-5 pt-8 md:px-8 md:pt-12">
        <nav className="mb-8 flex items-center gap-2 overflow-hidden text-sm text-text-secondary" aria-label="Điều hướng">
          <Link to="/" className="shrink-0 hover:text-primary">Trang chủ</Link>
          <ChevronRight size={16} />
          <Link to="/articles" className="shrink-0 hover:text-primary">Bài viết</Link>
          <ChevronRight size={16} />
          <span className="truncate font-semibold text-primary">{item.tieu_de}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <article className="lg:col-span-8">
            <header className="mb-10">
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${category.tone}`}>{category.icon}{category.label}</span>
                <span className="flex items-center gap-1.5 text-sm text-text-secondary">{formatDate(item.ngay_tao)}</span>
                <span className="flex items-center gap-1.5 text-sm text-text-secondary">{item.luot_xem || 0} lượt xem</span>
              </div>
              <h1 className="text-3xl font-bold leading-tight tracking-[-0.02em] text-text-primary md:text-5xl">{item.tieu_de}</h1>
              {item.tom_tat && <p className="mt-6 border-l-4 border-primary pl-5 text-lg italic leading-8 text-text-secondary">"{item.tom_tat}"</p>}
            </header>

            {item.hinh_anh && <div className="mb-10 aspect-video overflow-hidden rounded-xl bg-background shadow-lg"><img src={item.hinh_anh} alt={item.tieu_de} className="h-full w-full object-cover" /></div>}

            <div className="article-reading" dangerouslySetInnerHTML={{ __html: item.noi_dung }} />

            <div className="mt-12 border-t border-border pt-6">
              <Link to="/articles" className="inline-flex items-center gap-2 font-bold text-primary transition hover:gap-3"><ArrowLeft size={20} />Quay lại danh sách bài viết</Link>
            </div>
          </article>

          <aside className="space-y-9 lg:col-span-4">
            <form onSubmit={(event) => event.preventDefault()} className="rounded-xl bg-background p-6">
              <h2 className="mb-4 text-xl font-bold text-text-primary">Tìm kiếm bài viết</h2>
              <label className="relative block"><span className="sr-only">Từ khóa tìm kiếm</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Nhập từ khóa..." className="w-full rounded-lg border-0 bg-card py-3 pl-11 pr-4 text-text-primary outline-none ring-0 transition focus:ring-2 focus:ring-primary" /><Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" /></label>
            </form>

            {related.length > 0 && <section><h2 className="inline-block border-b-2 border-primary pb-1 text-xl font-bold text-text-primary">Tin liên quan</h2><div className="mt-5 space-y-5">{related.filter((post) => !searchQuery || post.tieu_de.toLocaleLowerCase('vi-VN').includes(searchQuery.toLocaleLowerCase('vi-VN'))).map((post) => <Link key={post.ma_bai_viet} to={`/articles/${post.ma_bai_viet}`} className="group flex gap-4"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-background">{post.hinh_anh ? <img src={post.hinh_anh} alt={post.tieu_de} className="h-full w-full object-cover transition duration-300 group-hover:scale-110" /> : <FileText size={24} className="flex h-full items-center justify-center text-primary/30" />}</div><div className="min-w-0"><h3 className="line-clamp-2 font-semibold leading-6 text-text-primary transition-colors group-hover:text-primary">{post.tieu_de}</h3><p className="mt-1 text-sm text-text-secondary">{formatDate(post.ngay_tao)}</p></div></Link>)}</div></section>}

            <section className="glass-card overflow-hidden rounded-xl p-6"><h2 className="text-xl font-bold text-primary">Nhận tin nông sản</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Cập nhật giá cả và mùa vụ mới nhất hàng tuần qua email của bạn.</p><form className="mt-4 space-y-2" onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Email của bạn" className="w-full rounded-lg border border-border bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary" /><button type="submit" className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90">Đăng ký ngay</button></form></section>
          </aside>
        </div>
      </div>

      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Lên đầu trang" className={`fixed bottom-8 right-8 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all ${showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-8 opacity-0'}`}><ChevronUp size={24} /></button>
    </main>
  );
}
