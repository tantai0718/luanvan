import { useEffect, useState, useRef } from 'react';
import { baiVietAPI, categoryAPI } from '../../services/api';
import { Plus, FileText, CheckCircle, Edit3, Eye, Edit, Trash2, X, ImagePlus, Upload, Save, Loader2, Bold, List, Image as ImageIcon, Type, Search } from 'lucide-react';
import { Btn, Loading } from '../../components/ui/AdminUI';

const emptyForm = { tieu_de: '', tom_tat: '', noi_dung: '', hinh_anh: '', madm: 4, trang_thai: 1 };

const readFileAsDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}`));
  reader.readAsDataURL(file);
});

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminArticles() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDm, setFilterDm] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchItems = () => {
    setLoading(true);
    const q = `?${search ? `q=${encodeURIComponent(search)}` : ''}${filterDm ? `&the_loai=${filterDm}` : ''}`;
    baiVietAPI.adminAll(q).then(data => setItems(data.items)).catch(() => {}).finally(() => setLoading(false));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMsg('Chỉ chấp nhận file ảnh'); return; }
    setUploading(true); setMsg('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const data = await baiVietAPI.uploadImage({ base64: dataUrl, filename: file.name });
      setEditing(prev => ({ ...prev, hinh_anh: data.url }));
    } catch (err) { setMsg(err.message || 'Lỗi tải ảnh'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  useEffect(() => { categoryAPI.getAll().then(d => {
    const bvCats = (d.categories || d || []).filter(c => c.loai === 'bai_viet');
    setCategories(bvCats);
  }).catch(() => {}); }, []);

  useEffect(() => { fetchItems(); }, [search, filterDm]);

  const handleSave = async () => {
    if (!editing.tieu_de.trim()) { setMsg('Thiếu tiêu đề'); return; }
    if (!editing.noi_dung.trim()) { setMsg('Thiếu nội dung'); return; }
    setSaving(true); setMsg('');
    try {
      if (editing.ma_bai_viet) {
        await baiVietAPI.update(editing.ma_bai_viet, editing);
      } else {
        await baiVietAPI.create(editing);
      }
      setEditing(null); fetchItems();
    } catch (err) { setMsg(err.message || 'Lỗi lưu'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Xóa bài viết này?')) return;
    try { await baiVietAPI.remove(id); fetchItems(); } catch (err) { alert(err.message); }
  };

  const handleToggle = async id => {
    const item = items.find(i => i.ma_bai_viet === id);
    if (!item) return;
    try { await baiVietAPI.update(id, { trang_thai: item.trang_thai ? 0 : 1 }); fetchItems(); } catch (err) { alert(err.message); }
  };

  const handleInsertTag = (tag) => {
    if (!editorRef.current) return;
    const ta = editorRef.current;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = editing.noi_dung.substring(start, end);
    const before = editing.noi_dung.substring(0, start);
    const after = editing.noi_dung.substring(end);
    const tags = { p: `<p>${sel || 'Nội dung...'}</p>`, h2: `<h2>${sel || 'Tiêu đề mục'}</h2>`, h3: `<h3>${sel || 'Tiêu đề nhỏ'}</h3>`, ul: `<ul>\n  <li>${sel || 'Mục 1'}</li>\n</ul>`, img: `<img src="${sel || 'url-hinh'}" alt="Mô tả" />`, bold: `<strong>${sel || 'đậm'}</strong>` };
    setEditing({ ...editing, noi_dung: before + (tags[tag] || '') + after });
  };

  const total = items.length;
  const published = items.filter(i => i.trang_thai === 1).length;
  const drafts = items.filter(i => i.trang_thai === 0).length;

  return (
    <div className="space-y-7">
      {/* ── Page Title ── */}
      <div className="bg-card rounded-card border border-border p-6 shadow-card md:flex md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="text-h2 text-text-primary">Quản lý tin tức</h2>
          <p className="text-body text-text-secondary">Cập nhật và điều hành nội dung tin tức nông nghiệp hàng ngày.</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => setEditing({ ...emptyForm })}>
            <Plus size={16} /> Thêm bài viết mới
          </Btn>
        </div>
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
            <span className="text-h1 text-amber-600">{items.reduce((s, i) => s + (i.luot_xem || 0), 0)}</span>
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
            <option value="">Tất cả chuyên mục</option>
            {categories.map(c => <option key={c.madm} value={c.madm}>{c.ten_danh_muc}</option>)}
          </select>
        </div>
      </div>

      {/* ── News Table ── */}
      <div className="bg-card rounded-card shadow-card border border-border overflow-hidden">
        {loading ? <Loading /> : items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Hình ảnh</th>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Tiêu đề</th>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Chuyên mục</th>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Ngày đăng</th>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Trạng thái</th>
                  <th className="p-5 text-[12px] font-semibold uppercase tracking-wider text-text-secondary text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map(item => (
                  <tr key={item.ma_bai_viet} className="hover:bg-background transition-colors group">
                    <td className="p-5">
                      {item.hinh_anh ? (
                        <img src={item.hinh_anh} alt={item.tieu_de} className="w-16 h-12 rounded-lg object-cover shadow-sm" />
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <FileText size={20} className="text-emerald-300" />
                        </div>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="max-w-xs">
                        <p className="text-body text-text-primary font-semibold line-clamp-2">{item.tieu_de}</p>
                        {item.tom_tat && <p className="text-caption text-text-secondary line-clamp-1 mt-0.5">{item.tom_tat}</p>}
                      </div>
                    </td>
                    <td className="p-5">
                      {item.ten_danh_muc && <span className="px-3 py-1 bg-primary/10 text-primary text-[12px] font-semibold uppercase tracking-wider rounded-full">{item.ten_danh_muc}</span>}
                    </td>
                    <td className="p-5">
                      <p className="text-caption text-text-secondary">{fmtDate(item.ngay_tao)}</p>
                    </td>
                    <td className="p-5">
                      <button onClick={() => handleToggle(item.ma_bai_viet)}
                        className={`flex items-center gap-1.5 font-bold text-caption ${item.trang_thai ? 'text-primary' : 'text-text-secondary'}`}>
                        <span className={`w-2 h-2 rounded-full ${item.trang_thai ? 'bg-primary' : 'bg-border'}`} />
                        {item.trang_thai ? 'Đã xuất bản' : 'Bản nháp'}
                      </button>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing(item)} className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-btn transition-all" title="Sửa">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(item.ma_bai_viet)} className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-btn transition-all" title="Xóa">
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
            <Btn onClick={() => setEditing({ ...emptyForm })} className="mt-4">
              <Plus size={16} /> Thêm bài viết mới
            </Btn>
          </div>
        )}
      </div>

      {/* ── Editor Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-8 px-4 overflow-y-auto pb-8" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-btn w-full max-w-3xl shadow-xl border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-h3 text-text-primary">{editing.ma_bai_viet ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h2>
                <p className="text-caption text-text-secondary mt-0.5">{editing.ma_bai_viet ? `ID: ${editing.ma_bai_viet}` : 'Tạo bài viết mới'}</p>
              </div>
              <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-full hover:bg-background flex items-center justify-center transition-colors">
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
              <label className="grid gap-2">
                <span className="text-caption font-bold text-text-secondary">Tiêu đề <span className="text-danger">*</span></span>
                <input value={editing.tieu_de} onChange={e => setEditing({ ...editing, tieu_de: e.target.value })}
                  placeholder="Nhập tiêu đề bài viết..."
                  className="bg-card border border-border rounded-btn px-4 py-3 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>
              <label className="grid gap-2">
                <span className="text-caption font-bold text-text-secondary">Tóm tắt</span>
                <textarea rows={2} value={editing.tom_tat || ''} onChange={e => setEditing({ ...editing, tom_tat: e.target.value })}
                  placeholder="Mô tả ngắn gọn..."
                  className="bg-card border border-border rounded-btn px-4 py-3 text-body resize-none focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>
              <label className="grid gap-2">
                <span className="text-caption font-bold text-text-secondary">Trạng thái</span>
                <select value={editing.trang_thai} onChange={e => setEditing({ ...editing, trang_thai: Number(e.target.value) })}
                  className="bg-card border border-border rounded-btn px-4 py-3 text-body outline-none">
                  <option value={1}>Đã xuất bản</option>
                  <option value={0}>Bản nháp</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-caption font-bold text-text-secondary">Chuyên mục</span>
                <select value={editing.madm || ''} onChange={e => setEditing({ ...editing, madm: Number(e.target.value) })}
                  className="bg-card border border-border rounded-btn px-4 py-3 text-body outline-none">
                  <option value="">Chọn chuyên mục</option>
                  {categories.map(c => <option key={c.madm} value={c.madm}>{c.ten_danh_muc}</option>)}
                </select>
              </label>
              <div className="grid gap-2">
                <span className="text-caption font-bold text-text-secondary">Hình ảnh bìa</span>
                {editing.hinh_anh ? (
                  <div className="relative rounded-btn overflow-hidden border border-border">
                    <img src={editing.hinh_anh.startsWith('/upload/') ? `http://localhost:5000${editing.hinh_anh}` : editing.hinh_anh} alt="Ảnh bìa" className="w-full h-48 object-cover" />
                    <button type="button" onClick={() => setEditing(prev => ({ ...prev, hinh_anh: '' }))}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-btn cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                    {uploading ? (
                      <Loader2 size={32} className="animate-spin text-primary" />
                    ) : (
                      <>
                        <ImagePlus size={40} className="text-text-secondary/30" />
                        <span className="text-caption text-text-secondary mt-1">Chọn ảnh từ máy</span>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>
              <label className="grid gap-2">
                <span className="text-caption font-bold text-text-secondary">Nội dung (HTML) <span className="text-danger">*</span></span>
                <div className="flex flex-wrap gap-1 p-2 bg-background border border-border border-b-0 rounded-t-btn">
                  {[{ tag: 'p', icon: <Type size={16} />, lbl: 'Paragraph' }, { tag: 'h2', icon: <Type size={16} />, lbl: 'H2' }, { tag: 'h3', icon: <Type size={16} />, lbl: 'H3' }, { tag: 'bold', icon: <Bold size={16} />, lbl: 'Bold' }, { tag: 'ul', icon: <List size={16} />, lbl: 'List' }, { tag: 'img', icon: <ImageIcon size={16} />, lbl: 'Image' }].map(b => (
                    <button key={b.tag} onClick={() => handleInsertTag(b.tag)} title={b.lbl}
                      className="w-8 h-8 rounded-btn flex items-center justify-center text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors">
                      {b.icon}
                    </button>
                  ))}
                </div>
                <textarea ref={editorRef} rows={12} value={editing.noi_dung} onChange={e => setEditing({ ...editing, noi_dung: e.target.value })}
                  placeholder="<h2>Tiêu đề mục</h2>&#10;<p>Nội dung bài viết...</p>"
                  className="bg-card border border-border rounded-b-btn resize-none px-4 py-3 text-body font-mono leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>
            </div>

            <div className="px-8 py-5 border-t border-border bg-background flex justify-between items-center">
              <p className="text-caption">{msg && <span className="text-danger">{msg}</span>}</p>
              <div className="flex gap-3">
                <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-btn border border-border font-bold text-caption hover:bg-card transition-colors">Hủy</button>
                <Btn onClick={handleSave} disabled={saving}>
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Đang lưu...</> : <><Save size={16} /> {editing.ma_bai_viet ? 'Cập nhật' : 'Xuất bản'}</>}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
