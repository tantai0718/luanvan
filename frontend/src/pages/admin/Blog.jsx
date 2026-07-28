import { useEffect, useState } from 'react';
import { blogAPI } from '../../services/api';
import { Plus, FileText, CheckCircle, Edit3, Eye, Edit, Trash2, X, Search } from 'lucide-react';
import { Btn, Loading } from '../../components/ui/AdminUI';

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
          <h2 className="text-h2 text-text-primary">Quản lý Blog</h2>
          <p className="text-body text-text-secondary">Viết và quản lý bài viết trên trang Blog.</p>
        </div>
        <Btn onClick={() => setEditing({ ...emptyForm })}>
          <Plus size={16} /> Thêm bài viết mới
        </Btn>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-card flex flex-col gap-1 shadow-card border border-border">
          <span className="text-text-secondary text-[12px] font-semibold uppercase tracking-wider">Tổng bài viết</span>
          <div className="flex items-end justify-between">
            <span className="text-h1 text-primary">{total}</span>
            <FileText size={20} className="text-primary/40" />
          </div>
        </div>
        <div className="bg-card p-5 rounded-card flex flex-col gap-1 shadow-card border border-border">
          <span className="text-text-secondary text-[12px] font-semibold uppercase tracking-wider">Đã xuất bản</span>
          <div className="flex items-end justify-between">
            <span className="text-h1 text-primary">{published}</span>
            <CheckCircle size={20} className="text-primary/40" />
          </div>
        </div>
        <div className="bg-card p-5 rounded-card flex flex-col gap-1 shadow-card border border-border">
          <span className="text-text-secondary text-[12px] font-semibold uppercase tracking-wider">Bản nháp</span>
          <div className="flex items-end justify-between">
            <span className="text-h1 text-text-secondary">{drafts}</span>
            <Edit3 size={20} className="text-text-secondary/40" />
          </div>
        </div>
        <div className="bg-card p-5 rounded-card flex flex-col gap-1 shadow-card border border-border">
          <span className="text-text-secondary text-[12px] font-semibold uppercase tracking-wider">Lượt xem tổng</span>
          <div className="flex items-end justify-between">
            <span className="text-h1 text-amber-600">{totalViews}</span>
            <Eye size={20} className="text-amber-600/40" />
          </div>
        </div>
      </div>

      {/* ── Filter & Search ── */}
      <div className="bg-card p-4 rounded-card shadow-card flex flex-col md:flex-row gap-4 items-center justify-between border border-border">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm bài viết..."
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-btn focus:ring-2 focus:ring-primary focus:border-primary text-caption" />
          </div>
          <select value={filterDm} onChange={e => setFilterDm(e.target.value)}
            className="border border-border rounded-btn py-2.5 pl-3 pr-8 text-caption bg-card focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c.slug} value={c.slug}>{c.ten_dm}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-card rounded-card shadow-card border border-border overflow-hidden">
        {loading ? <Loading /> : posts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Hình ảnh</th>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Tiêu đề</th>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Danh mục</th>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Lượt xem</th>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Ngày tạo</th>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Trạng thái</th>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map(post => (
                  <tr key={post.mabv} className="hover:bg-background transition-colors group">
                    <td className="p-5">
                      {post.hinh_anh ? (
                        <img src={post.hinh_anh} alt={post.tieu_de} className="w-16 h-12 rounded-lg object-cover shadow-sm" />
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <FileText size={20} className="text-emerald-300" />
                        </div>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="max-w-xs">
                        <p className="text-body text-text-primary font-semibold line-clamp-2">{post.tieu_de}</p>
                        {post.tom_tat && <p className="text-caption text-text-secondary line-clamp-1 mt-0.5">{post.tom_tat}</p>}
                      </div>
                    </td>
                    <td className="p-5">
                      {post.ten_danh_muc && <span className="px-3 py-1 bg-primary/10 text-primary text-[12px] font-semibold uppercase tracking-wider rounded-full">{post.ten_danh_muc}</span>}
                    </td>
                    <td className="p-5"><p className="text-caption text-text-secondary">{post.luot_xem}</p></td>
                    <td className="p-5"><p className="text-caption text-text-secondary">{fmtDate(post.ngay_tao)}</p></td>
                    <td className="p-5">
                      <button onClick={() => handleToggle(post.mabv)}
                        className={`flex items-center gap-1.5 font-bold text-caption ${post.trang_thai ? 'text-primary' : 'text-text-secondary'}`}>
                        <span className={`w-2 h-2 rounded-full ${post.trang_thai ? 'bg-primary' : 'bg-border'}`} />
                        {post.trang_thai ? 'Đã xuất bản' : 'Bản nháp'}
                      </button>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing(post)} className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-btn transition-all" title="Sửa">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(post.mabv)} className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-btn transition-all" title="Xóa">
                          <Trash2 size={18} />
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
            <FileText size={48} className="mx-auto text-text-secondary/15" />
            <p className="text-body text-text-secondary mt-3">Chưa có bài viết nào.</p>
          </div>
        )}
      </div>

      {/* ── Editor Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-8 px-4 overflow-y-auto pb-8" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-btn w-full max-w-3xl shadow-xl border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-h3 text-text-primary">{editing.mabv ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h2>
              <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-full hover:bg-background flex items-center justify-center transition-colors">
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
              <label className="grid gap-2">
                <span className="text-caption font-bold text-text-secondary">Tiêu đề <span className="text-danger">*</span></span>
                <input value={editing.tieu_de} onChange={e => setEditing({ ...editing, tieu_de: e.target.value })}
                  placeholder="Nhập tiêu đề..."
                  className="bg-card border border-border rounded-btn px-4 py-3 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>

              <label className="grid gap-2">
                <span className="text-caption font-bold text-text-secondary">Tóm tắt</span>
                <textarea rows={2} value={editing.tom_tat || ''} onChange={e => setEditing({ ...editing, tom_tat: e.target.value })}
                  placeholder="Mô tả ngắn gọn..."
                  className="bg-card border border-border rounded-btn px-4 py-3 text-body resize-none focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-caption font-bold text-text-secondary">Danh mục</span>
                  <select value={editing.madm} onChange={e => setEditing({ ...editing, madm: Number(e.target.value) })}
                    className="bg-card border border-border rounded-btn px-4 py-3 text-body outline-none">
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.ten_dm}</option>)}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-caption font-bold text-text-secondary">Trạng thái</span>
                  <select value={editing.trang_thai} onChange={e => setEditing({ ...editing, trang_thai: Number(e.target.value) })}
                    className="bg-card border border-border rounded-btn px-4 py-3 text-body outline-none">
                    <option value={1}>Đã xuất bản</option>
                    <option value={0}>Bản nháp</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-caption font-bold text-text-secondary">Nội dung (HTML) <span className="text-danger">*</span></span>
                <textarea rows={12} value={editing.noi_dung} onChange={e => setEditing({ ...editing, noi_dung: e.target.value })}
                  placeholder="<h2>Tiêu đề mục</h2>&#10;<p>Nội dung...</p>"
                  className="bg-card border border-border rounded-btn resize-none px-4 py-3 text-body font-mono leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>
            </div>

            <div className="px-8 py-5 border-t border-border bg-background flex justify-between items-center">
              <p className="text-caption">{msg && <span className="text-danger">{msg}</span>}</p>
              <div className="flex gap-3">
                <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-btn border border-border font-bold text-caption hover:bg-card transition-colors">Hủy</button>
                <Btn onClick={handleSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : editing.mabv ? 'Cập nhật' : 'Xuất bản'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
