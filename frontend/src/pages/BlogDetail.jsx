import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { blogAPI } from '../services/api';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function BlogDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    blogAPI.getById(id)
      .then(data => { setPost(data.post); setRelated(data.related || []); })
      .catch(err => setError(err.message || 'Không tìm thấy bài viết'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !post) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant/20">error</span>
      <p className="text-body-lg text-on-surface-variant">{error || 'Không tìm thấy bài viết'}</p>
      <Link to="/blog" className="text-primary font-bold hover:underline">← Quay lại danh sách</Link>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">

      {/* ── Breadcrumb ── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-8">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link to="/blog" className="hover:text-primary transition-colors">Bài viết</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-semibold line-clamp-1">{post.tieu_de}</span>
        </nav>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ═══ Article Content ═══ */}
          <article className="lg:col-span-8">

            {/* ── Header ── */}
            <header className="mb-12">
              <div className="flex items-center gap-4 mb-4">
                {post.ten_danh_muc && (
                  <span className="px-3 py-1 rounded-full text-label-caps font-semibold bg-primary/10 text-primary">
                    {post.ten_danh_muc}
                  </span>
                )}
                <div className="flex items-center gap-1 text-on-surface-variant text-body-sm">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  {fmtDate(post.ngay_tao)}
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant text-body-sm">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  {post.luot_xem} lượt xem
                </div>
              </div>

              <h1 className="text-headline-lg-mobile md:text-display-lg text-on-surface mb-4 leading-tight font-bold">
                {post.tieu_de}
              </h1>

              {post.tom_tat && (
                <p className="text-body-lg text-on-surface-variant italic border-l-4 border-primary pl-4">
                  "{post.tom_tat}"
                </p>
              )}
            </header>

            {/* ── Hero Image ── */}
            {post.hinh_anh && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-12 shadow-lg">
                <img src={post.hinh_anh} alt={post.tieu_de} className="w-full h-full object-cover" />
              </div>
            )}

            {/* ── Article Body ── */}
            <div
              className="blog-content prose prose-lg max-w-none
                prose-headings:text-on-surface prose-headings:font-bold
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-on-surface-variant prose-p:text-body-md prose-p:leading-relaxed
                prose-a:text-primary prose-a:underline prose-a:decoration-primary/30 hover:prose-a:decoration-primary
                prose-strong:text-on-surface
                prose-ul:text-on-surface-variant prose-ol:text-on-surface-variant
                prose-li:marker:text-primary
                prose-img:rounded-xl prose-img:shadow-md
                prose-blockquote:border-primary prose-blockquote:text-on-surface-variant prose-blockquote:italic"
              dangerouslySetInnerHTML={{ __html: post.noi_dung }}
            />

            {/* ── Navigation Back ── */}
            <div className="mt-12 pt-8 border-t border-outline-variant">
              <Link to="/blog" className="inline-flex items-center gap-2 text-primary font-bold text-body-lg hover:gap-3 transition-all">
                <span className="material-symbols-outlined">arrow_back</span>
                Quay lại danh sách bài viết
              </Link>
            </div>
          </article>

          {/* ═══ Sidebar ═══ */}
          <aside className="lg:col-span-4 space-y-8">

            {/* ── Search Box ── */}
            <div className="bg-surface-container-high p-6 rounded-xl">
              <h4 className="font-bold text-lg text-on-surface mb-4">Tìm kiếm bài viết</h4>
              <div className="relative">
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Nhập từ khóa..."
                  className="w-full bg-surface rounded-lg pl-10 pr-4 py-2.5 text-body-sm border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              </div>
            </div>

            {/* ── Related Posts ── */}
            {related.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-on-surface border-b-2 border-primary inline-block pb-1">Tin liên quan</h4>
                <div className="space-y-4">
                  {related.map(item => (
                    <Link key={item.mabv} to={`/blog/${item.mabv}`} className="flex gap-4 group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        {item.hinh_anh ? (
                          <img src={item.hinh_anh} alt={item.tieu_de} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-primary/30">article</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h5 className="font-body-md font-semibold text-on-surface line-clamp-2 group-hover:text-primary transition-colors text-sm leading-snug">
                          {item.tieu_de}
                        </h5>
                        <span className="text-body-sm text-on-surface-variant mt-1 block">{fmtDate(item.ngay_tao)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Newsletter Card ── */}
            <div className="glass-card p-6 rounded-xl">
              <h4 className="font-bold text-lg text-primary mb-2">Nhận tin nông sản</h4>
              <p className="text-body-sm text-on-surface-variant mb-4">
                Cập nhật giá cả và mùa vụ mới nhất hàng tuần qua email của bạn.
              </p>
              <form className="space-y-2" onSubmit={e => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:ring-primary bg-white/50 outline-none transition-all"
                />
                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary py-2.5 rounded-lg text-label-caps font-semibold hover:bg-on-primary-fixed-variant transition-colors"
                >
                  Đăng ký ngay
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Scroll to top FAB ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 bg-primary text-on-primary w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 z-50 ${
          showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <span className="material-symbols-outlined">expand_less</span>
      </button>
    </div>
  );
}
