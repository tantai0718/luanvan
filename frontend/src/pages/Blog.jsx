import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogAPI } from '../services/api';

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
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
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
                className={`px-4 py-2 rounded-lg text-body-sm font-bold transition-all ${!filter ? 'bg-primary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>
                Tất cả
              </button>
              {categories.map(c => (
                <button key={c.slug} onClick={() => { setFilter(c.slug); setPage(1); }}
                  className={`px-4 py-2 rounded-lg text-body-sm font-bold transition-all ${filter === String(c.slug) ? 'bg-primary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>
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
                      className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-outline-variant group transition-all">
                      <div className="aspect-video overflow-hidden">
                        {post.hinh_anh ? (
                          <img src={post.hinh_anh} alt={post.tieu_de} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-emerald-200">article</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          {post.ten_danh_muc && <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-label-caps rounded-full font-bold">{post.ten_danh_muc}</span>}
                          <span className="text-on-surface-variant font-body-sm text-body-sm">{fmtDate(post.ngay_tao)}</span>
                        </div>
                        <h3 className="font-h3 text-h3 text-on-surface mb-2 leading-snug group-hover:text-primary transition-colors">{post.tieu_de}</h3>
                        {post.tom_tat && <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">{post.tom_tat}</p>}
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-outline-variant/40">
                          <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-primary">person</span>{post.ho_ten}
                          </span>
                          <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-primary">visibility</span>{post.luot_xem}
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
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary hover:text-primary transition-all disabled:opacity-40">
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${p === page ? 'bg-primary text-white shadow-sm' : 'border border-outline-variant hover:border-primary hover:text-primary'}`}>{p}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary hover:text-primary transition-all disabled:opacity-40">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="py-24 text-center">
                <span className="material-symbols-outlined text-7xl text-on-surface-variant/15">article</span>
                <p className="text-body-lg text-on-surface-variant mt-4">Chưa có bài viết nào.</p>
              </div>
            )}
          </div>

          {/* ═══ Sidebar ═══ */}
          <aside className="lg:col-span-4 space-y-8">

            {/* ── Danh mục ── */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant">
              <h2 className="font-h3 text-h3 text-primary mb-6 border-b border-outline-variant pb-3">Danh mục</h2>
              <nav className="flex flex-col gap-2">
                <button onClick={() => { setFilter(''); setPage(1); }}
                  className={`flex justify-between items-center px-4 py-2.5 rounded-lg transition-all text-left ${!filter ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container text-on-surface'}`}>
                  <span className="font-body-md text-body-md">Tất cả</span>
                </button>
                {categories.map(c => (
                  <button key={c.slug} onClick={() => { setFilter(c.slug); setPage(1); }}
                    className={`flex justify-between items-center px-4 py-2.5 rounded-lg transition-all text-left ${filter === String(c.slug) ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container text-on-surface'}`}>
                    <span className="font-body-md text-body-md">{c.ten_dm}</span>
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
