import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogAPI } from '../services/api';
import { ChevronRight, ChevronLeft, User, Eye, FileText } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 6;

  useEffect(() => {
    setLoading(true);
    const q = `page=${page}&limit=${limit}${filter ? `&madm=${filter}` : ''}`;
    blogAPI.getAll(q)
      .then(data => { setPosts(data.posts || []); setTotal(data.total || 0); setCategories(data.categories || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-background min-h-screen">

      {/* ── Breadcrumb ── */}
      <div className="max-w-[1280px] mx-auto px-6 pt-8">
        <nav className="flex items-center gap-2 text-body text-text-secondary mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <ChevronRight size={16} />
          <span className="text-primary font-semibold">Blog</span>
        </nav>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ═══ Main Content ═══ */}
          <div className="lg:col-span-8 space-y-8">

            {/* ── Filter Tabs ── */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setFilter(''); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-body font-bold transition-all ${!filter ? 'bg-primary text-white shadow-sm' : 'bg-white border border-border text-text-secondary hover:border-primary hover:text-primary'}`}>
                Tất cả
              </button>
              {categories.map(c => (
                <button key={c.slug} onClick={() => { setFilter(c.slug); setPage(1); }}
                  className={`px-4 py-2 rounded-lg text-body font-bold transition-all ${filter === String(c.slug) ? 'bg-primary text-white shadow-sm' : 'bg-white border border-border text-text-secondary hover:border-primary hover:text-primary'}`}>
                  {c.ten_dm}
                </button>
              ))}
            </div>

            {/* ── Posts Grid ── */}
            {loading ? (
              <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : posts.length ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map(post => (
                    <Link key={post.mabv} to={`/blog/${post.mabv}`}
                      className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-border group transition-all">
                      <div className="aspect-video overflow-hidden">
                        {post.hinh_anh ? (
                          <img src={post.hinh_anh} alt={post.tieu_de} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                            <FileText size={48} className="text-emerald-200" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          {post.ten_danh_muc && <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[12px] font-medium rounded-full">{post.ten_danh_muc}</span>}
                          <span className="text-text-secondary text-body">{fmtDate(post.ngay_tao)}</span>
                        </div>
                        <h3 className="text-h3 text-text-primary mb-2 leading-snug group-hover:text-primary transition-colors">{post.tieu_de}</h3>
                        {post.tom_tat && <p className="text-body text-text-secondary line-clamp-3">{post.tom_tat}</p>}
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
                          <span className="text-body text-text-secondary flex items-center gap-1">
                            <User size={14} className="text-primary" />{post.ho_ten}
                          </span>
                          <span className="text-body text-text-secondary flex items-center gap-1">
                            <Eye size={14} className="text-primary" />{post.luot_xem}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <nav className="flex justify-center items-center gap-3 pt-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary transition-all disabled:opacity-40">
                      <ChevronLeft size={20} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${p === page ? 'bg-primary text-white shadow-sm' : 'border border-border hover:border-primary hover:text-primary'}`}>{p}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary transition-all disabled:opacity-40">
                      <ChevronRight size={20} />
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="py-24 text-center">
                <FileText size={72} className="mx-auto text-text-secondary/15" />
                <p className="text-body-lg text-text-secondary mt-4">Chưa có bài viết nào.</p>
              </div>
            )}
          </div>

          {/* ═══ Sidebar ═══ */}
          <aside className="lg:col-span-4 space-y-8">

            {/* ── Danh mục ── */}
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h2 className="text-h3 text-primary mb-6 border-b border-border pb-3">Danh mục</h2>
              <nav className="flex flex-col gap-2">
                <button onClick={() => { setFilter(''); setPage(1); }}
                  className={`flex justify-between items-center px-4 py-2.5 rounded-lg transition-all text-left ${!filter ? 'bg-primary/10 text-primary' : 'hover:bg-background text-text-primary'}`}>
                  <span className="text-body">Tất cả</span>
                </button>
                {categories.map(c => (
                  <button key={c.slug} onClick={() => { setFilter(c.slug); setPage(1); }}
                    className={`flex justify-between items-center px-4 py-2.5 rounded-lg transition-all text-left ${filter === String(c.slug) ? 'bg-primary/10 text-primary' : 'hover:bg-background text-text-primary'}`}>
                    <span className="text-body">{c.ten_dm}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
