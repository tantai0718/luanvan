import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { baiVietAPI } from '../services/api';

const theLoaiMap = {
  quy_trinh: { label: 'Quy trình', color: 'bg-emerald-50 text-emerald-700', icon: 'eco' },
  suc_khoe: { label: 'Sức khỏe', color: 'bg-blue-50 text-blue-700', icon: 'favorite' },
  am_thuc: { label: 'Ẩm thực', color: 'bg-orange-50 text-orange-700', icon: 'restaurant' },
  kinh_nghiem: { label: 'Kinh nghiệm', color: 'bg-purple-50 text-purple-700', icon: 'lightbulb' },
  khac: { label: 'Khác', color: 'bg-gray-100 text-gray-600', icon: 'article' },
};

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtDateFull(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
}
function timeAgo(d) {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  return fmtDate(d);
}

export default function Articles() {
  const [all, setAll] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 6;

  useEffect(() => {
    setLoading(true);
    baiVietAPI.getAll('?limit=100').then(data => {
      setAll(data.items || []);
      setTotal(data.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = all;
    if (filter) filtered = all.filter(i => i.the_loai === filter);
    setTotal(filtered.length);
    setItems(filtered.slice((page - 1) * limit, page * limit));
  }, [all, filter, page]);

  const totalPages = Math.ceil(total / limit);
  const featured = all.find(i => i.trang_thai === 1) || all[0];
  const recentItems = all.filter(i => i.ma_bai_viet !== featured?.ma_bai_viet).slice(0, 5);

  const categoryCounts = {};
  all.forEach(i => { categoryCounts[i.the_loai] = (categoryCounts[i.the_loai] || 0) + 1; });

  const TL = (tl) => theLoaiMap[tl] || theLoaiMap.khac;

  return (
    <div className="bg-background min-h-screen">

      {/* ── Breadcrumb ── */}
      <div className="max-w-[1280px] mx-auto px-6 pt-8">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-semibold">Tin tức</span>
        </nav>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ═══ Main Content ═══ */}
          <div className="lg:col-span-8 space-y-12">

            {loading ? (
              <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : featured ? (
              <>
                {/* ── Hero/Featured Article ── */}
                <Link to={`/articles/${featured.ma_bai_viet}`} className="relative group overflow-hidden rounded-xl shadow-lg bg-surface-container-lowest block">
                  <div className="aspect-[16/9] w-full overflow-hidden">
                    {featured.hinh_anh ? (
                      <img src={featured.hinh_anh} alt={featured.tieu_de} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-green-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-7xl text-emerald-300">{TL(featured.the_loai).icon}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 p-6 text-white">
                    <span className="inline-block px-4 py-1 bg-secondary text-white rounded-full font-label-caps text-label-caps mb-3">NỔI BẬT</span>
                    <h1 className="font-h2 text-h2 mb-3 text-white leading-tight">{featured.tieu_de}</h1>
                    {featured.tom_tat && <p className="font-body-md text-body-md text-white/90 line-clamp-2 max-w-2xl mb-4">{featured.tom_tat}</p>}
                    <span className="inline-flex items-center gap-2 bg-primary hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all">
                      Đọc tiếp <span className="material-symbols-outlined">arrow_forward</span>
                    </span>
                  </div>
                </Link>

                {/* ── Bento Grid ── */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.filter(i => i.ma_bai_viet !== featured.ma_bai_viet).slice(0, 5).map((item, idx) => {
                    const tl = TL(item.the_loai);
                    const isWide = idx === 2 && items.length > 3;
                    return (
                      <Link key={item.ma_bai_viet} to={`/articles/${item.ma_bai_viet}`}
                        className={`bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-outline-variant group transition-all ${isWide ? 'md:col-span-2 flex flex-col md:flex-row' : ''}`}>

                        <div className={`${isWide ? 'md:w-1/2 h-64 md:h-auto' : 'aspect-video'} overflow-hidden`}>
                          {item.hinh_anh ? (
                            <img src={item.hinh_anh} alt={item.tieu_de} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                              <span className="material-symbols-outlined text-5xl text-emerald-200">{tl.icon}</span>
                            </div>
                          )}
                        </div>

                        <div className={`p-6 ${isWide ? 'md:w-1/2 flex flex-col justify-center' : ''}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-primary font-label-caps text-label-caps">{tl.label.toUpperCase()}</span>
                            <span className="text-outline text-[4px]">•</span>
                            <span className="text-on-surface-variant font-body-sm text-body-sm">{fmtDateFull(item.ngay_dang)}</span>
                          </div>
                          <h3 className="font-h3 text-h3 text-on-surface mb-3 leading-snug">{item.tieu_de}</h3>
                          {item.tom_tat && <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">{item.tom_tat}</p>}
                          {isWide && (
                            <span className="text-primary font-bold hover:underline flex items-center gap-1 mt-3">
                              Xem chi tiết <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </section>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <nav className="flex justify-center items-center gap-3 pt-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all disabled:opacity-40">
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${
                          p === page ? 'bg-primary text-white shadow-sm' : 'border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                        }`}>{p}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all disabled:opacity-40">
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

            {/* ── Bài viết mới ── */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant">
              <h2 className="font-h3 text-h3 text-primary mb-6 border-b border-outline-variant pb-3">Bài viết mới</h2>
              <ul className="space-y-4">
                {recentItems.map(item => (
                  <li key={item.ma_bai_viet} className="flex gap-4 group">
                    <Link to={`/articles/${item.ma_bai_viet}`} className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      {item.hinh_anh ? (
                        <img src={item.hinh_anh} alt={item.tieu_de} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-emerald-300">article</span>
                        </div>
                      )}
                    </Link>
                    <div className="flex-grow min-w-0">
                      <Link to={`/articles/${item.ma_bai_viet}`}>
                        <h4 className="font-body-md text-body-md font-semibold text-on-surface line-clamp-2 group-hover:text-primary transition-colors">{item.tieu_de}</h4>
                      </Link>
                      <span className="text-on-surface-variant font-body-sm text-body-sm">{timeAgo(item.ngay_dang)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Danh mục tin tức ── */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant">
              <h2 className="font-h3 text-h3 text-primary mb-6 border-b border-outline-variant pb-3">Danh mục tin tức</h2>
              <nav className="flex flex-col gap-2">
                {Object.entries(categoryCounts).map(([key, count]) => (
                  <button key={key} onClick={() => { setFilter(filter === key ? '' : key); setPage(1); }}
                    className={`flex justify-between items-center px-4 py-2.5 rounded-lg transition-all text-left ${
                      filter === key ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container text-on-surface'
                    }`}>
                    <span className="font-body-md text-body-md">{TL(key).label}</span>
                    <span className={`px-2 py-0.5 rounded text-[12px] font-bold ${filter === key ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-variant'}`}>{count}</span>
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
