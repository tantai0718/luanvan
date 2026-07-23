import { useEffect, useState } from 'react';
import { blogAPI } from '../../services/api';

const emptyForm = { tieu_de: '', tom_tat: '', noi_dung: '', hinh_anh: '', madm: 5, trang_thai: 1 };

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDm, setFilterDm] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchPosts = () => {
    setLoading(true);
    const q = `?${search ? `q=${encodeURIComponent(search)}` : ''}${filterDm ? `&madm=${filterDm}` : ''}`;
    blogAPI.getAll(q)
      .then(data => { setPosts(data.posts || []); setCategories(data.categories || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, [search, filterDm]);

  const handleSave = async () => {
    if (!editing.tieu_de.trim()) { setMsg('Thiếu tiêu đề'); return; }
    if (!editing.noi_dung.trim()) { setMsg('Thiếu nội dung'); return; }
    setSaving(true); setMsg('');
    try {
      if (editing.mabv) {
        await blogAPI.update(editing.mabv, editing);
      } else {
        await blogAPI.create(editing);
      }
      setEditing(null); fetchPosts();
    } catch (err) { setMsg(err.message || 'Lỗi lưu'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (mabv) => {
    if (!window.confirm('Ẩn bài viết này?')) return;
    try { await blogAPI.remove(mabv); fetchPosts(); } catch (err) { alert(err.message); }
  };

  const handleToggle = async (mabv) => {
    const post = posts.find(p => p.mabv === mabv);
    if (!post) return;
    try { await blogAPI.update(mabv, { trang_thai: post.trang_thai ? 0 : 1 }); fetchPosts(); } catch (err) { alert(err.message); }
  };

  const total = posts.length;
  const published = posts.filter(p => p.trang_thai === 1).length;
  const drafts = posts.filter(p => p.trang_thai === 0).length;
  const totalViews = posts.reduce((s, p) => s + (p.luot_xem || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Page Title ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-on-surface">Quản lý Blog</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Viết và quản lý bài viết trên trang Blog.</p>
        </div>
        <button onClick={() => setEditing({ ...emptyForm })}
          className="bg-primary text-on-primary px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all">
          <span className="material-symbols-outlined text-base">add_circle</span>Thêm bài viết mới
        </button>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl flex flex-col gap-1 shadow-sm">
          <span className="text-on-surface-variant font-label-caps text-label-caps uppercase">Tổng bài viết</span>
          <div className="flex items-end justify-between">
            <span className="font-h2 text-h2 text-primary">{total}</span>
            <span className="material-symbols-outlined text-primary-container">article</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-xl flex flex-col gap-1 shadow-sm">
          <span className="text-on-surface-variant font-label-caps text-label-caps uppercase">Đã xuất bản</span>
          <div className="flex items-end justify-between">
            <span className="font-h2 text-h2 text-primary">{published}</span>
            <span className="material-symbols-outlined text-primary-container">check_circle</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-xl flex flex-col gap-1 shadow-sm">
          <span className="text-on-surface-variant font-label-caps text-label-caps uppercase">Bản nháp</span>
          <div className="flex items-end justify-between">
            <span className="font-h2 text-h2 text-on-surface-variant">{drafts}</span>
            <span className="material-symbols-outlined text-outline">edit_note</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-xl flex flex-col gap-1 shadow-sm">
          <span className="text-on-surface-variant font-label-caps text-label-caps uppercase">Lượt xem tổng</span>
          <div className="flex items-end justify-between">
            <span className="font-h2 text-h2 text-secondary">{totalViews}</span>
            <span className="material-symbols-outlined text-secondary">visibility</span>
          </div>
        </div>
      </div>

      {/* ── Filter & Search ── */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between border border-outline-variant/30">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm bài viết..."
              className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-sm" />
          </div>
          <select value={filterDm} onChange={e => setFilterDm(e.target.value)}
            className="border border-outline-variant rounded-lg py-2.5 pl-3 pr-8 text-body-sm bg-white focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c.slug} value={c.slug}>{c.ten_dm}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        {loading ? <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> : posts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase">Hình ảnh</th>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase">Tiêu đề</th>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase">Danh mục</th>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase">Lượt xem</th>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase">Ngày tạo</th>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase">Trạng thái</th>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {posts.map(post => (
                  <tr key={post.mabv} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="p-5">
                      {post.hinh_anh ? (
                        <img src={post.hinh_anh} alt={post.tieu_de} className="w-16 h-12 rounded-lg object-cover shadow-sm" />
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl text-emerald-300">article</span>
                        </div>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="max-w-xs">
                        <p className="font-body-md text-body-md text-on-surface font-semibold line-clamp-2">{post.tieu_de}</p>
                        {post.tom_tat && <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">{post.tom_tat}</p>}
                      </div>
                    </td>
                    <td className="p-5">
                      {post.ten_danh_muc && <span className="px-3 py-1 bg-primary/10 text-primary text-label-caps rounded-full font-bold">{post.ten_danh_muc}</span>}
                    </td>
                    <td className="p-5"><p className="font-body-sm text-body-sm text-on-surface-variant">{post.luot_xem}</p></td>
                    <td className="p-5"><p className="font-body-sm text-body-sm text-on-surface-variant">{fmtDate(post.ngay_tao)}</p></td>
                    <td className="p-5">
                      <button onClick={() => handleToggle(post.mabv)}
                        className={`flex items-center gap-1.5 font-bold text-body-sm ${post.trang_thai ? 'text-primary' : 'text-on-surface-variant'}`}>
                        <span className={`w-2 h-2 rounded-full ${post.trang_thai ? 'bg-primary' : 'bg-outline-variant'}`} />
                        {post.trang_thai ? 'Đã xuất bản' : 'Bản nháp'}
                      </button>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing(post)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Sửa">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button onClick={() => handleDelete(post.mabv)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all" title="Xóa">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/15">article</span>
            <p className="text-body-md text-on-surface-variant mt-3">Chưa có bài viết nào.</p>
          </div>
        )}
      </div>

      {/* ── Editor Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-8 px-4 overflow-y-auto pb-8" onClick={() => setEditing(null)}>
          <div className="bg-surface rounded-2xl w-full max-w-3xl organic-shadow border border-outline-variant overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-5 border-b border-outline-variant flex items-center justify-between">
              <h2 className="font-h3 text-h3 text-on-surface">{editing.mabv ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h2>
              <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
              <label className="grid gap-2">
                <span className="text-label-sm font-bold text-on-surface-variant">Tiêu đề <span className="text-error">*</span></span>
                <input value={editing.tieu_de} onChange={e => setEditing({ ...editing, tieu_de: e.target.value })}
                  placeholder="Nhập tiêu đề..."
                  className="bg-white border border-outline-variant rounded-lg px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>

              <label className="grid gap-2">
                <span className="text-label-sm font-bold text-on-surface-variant">Tóm tắt</span>
                <textarea rows={2} value={editing.tom_tat || ''} onChange={e => setEditing({ ...editing, tom_tat: e.target.value })}
                  placeholder="Mô tả ngắn gọn..."
                  className="bg-white border border-outline-variant rounded-lg px-4 py-3 text-body-md resize-none focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-label-sm font-bold text-on-surface-variant">Danh mục</span>
                  <select value={editing.madm} onChange={e => setEditing({ ...editing, madm: Number(e.target.value) })}
                    className="bg-white border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none">
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.ten_dm}</option>)}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-label-sm font-bold text-on-surface-variant">Trạng thái</span>
                  <select value={editing.trang_thai} onChange={e => setEditing({ ...editing, trang_thai: Number(e.target.value) })}
                    className="bg-white border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none">
                    <option value={1}>Đã xuất bản</option>
                    <option value={0}>Bản nháp</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-label-sm font-bold text-on-surface-variant">Nội dung (HTML) <span className="text-error">*</span></span>
                <textarea rows={12} value={editing.noi_dung} onChange={e => setEditing({ ...editing, noi_dung: e.target.value })}
                  placeholder="<h2>Tiêu đề mục</h2>&#10;<p>Nội dung...</p>"
                  className="bg-white border border-outline-variant rounded-lg resize-none px-4 py-3 text-body-md font-mono leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>
            </div>

            <div className="px-8 py-5 border-t border-outline-variant bg-surface-container-low flex justify-between items-center">
              <p className="text-body-sm">{msg && <span className="text-error">{msg}</span>}</p>
              <div className="flex gap-3">
                <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl border border-outline-variant font-bold text-body-sm hover:bg-surface-container transition-colors">Hủy</button>
                <button onClick={handleSave} disabled={saving}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-body-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50">
                  {saving ? 'Đang lưu...' : editing.mabv ? 'Cập nhật' : 'Xuất bản'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
