import { useEffect, useState, useRef } from 'react';
import { baiVietAPI, categoryAPI } from '../../services/api';

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
      <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-white via-white to-primary-fixed/30 p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="font-h2 text-h2 text-on-surface">Quản lý tin tức</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Cập nhật và điều hành nội dung tin tức nông nghiệp hàng ngày.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing({ ...emptyForm })}
            className="bg-primary text-on-primary px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-base">add_circle</span>Thêm bài viết mới
          </button>
        </div>
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
            <span className="font-h2 text-h2 text-secondary">{items.reduce((s, i) => s + (i.luot_xem || 0), 0)}</span>
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
            <option value="">Tất cả chuyên mục</option>
            {categories.map(c => <option key={c.madm} value={c.madm}>{c.ten_danh_muc}</option>)}
          </select>
        </div>
      </div>

      {/* ── News Table ── */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        {loading ? <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> : items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase">Hình ảnh</th>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase">Tiêu đề</th>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase">Chuyên mục</th>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase">Ngày đăng</th>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase">Trạng thái</th>
                  <th className="p-5 font-label-caps text-label-caps text-on-surface-variant uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {items.map(item => (
                  <tr key={item.ma_bai_viet} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="p-5">
                      {item.hinh_anh ? (
                        <img src={item.hinh_anh} alt={item.tieu_de} className="w-16 h-12 rounded-lg object-cover shadow-sm" />
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl text-emerald-300">article</span>
                        </div>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="max-w-xs">
                        <p className="font-body-md text-body-md text-on-surface font-semibold line-clamp-2">{item.tieu_de}</p>
                        {item.tom_tat && <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">{item.tom_tat}</p>}
                      </div>
                    </td>
                    <td className="p-5">
                      {item.ten_danh_muc && <span className="px-3 py-1 bg-primary/10 text-primary text-label-caps rounded-full font-bold">{item.ten_danh_muc}</span>}
                    </td>
                    <td className="p-5">
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{fmtDate(item.ngay_tao)}</p>
                    </td>
                    <td className="p-5">
                      <button onClick={() => handleToggle(item.ma_bai_viet)}
                        className={`flex items-center gap-1.5 font-bold text-body-sm ${item.trang_thai ? 'text-primary' : 'text-on-surface-variant'}`}>
                        <span className={`w-2 h-2 rounded-full ${item.trang_thai ? 'bg-primary' : 'bg-outline-variant'}`} />
                        {item.trang_thai ? 'Đã xuất bản' : 'Bản nháp'}
                      </button>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing(item)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Sửa">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button onClick={() => handleDelete(item.ma_bai_viet)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all" title="Xóa">
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
            <button onClick={() => setEditing({ ...emptyForm })} className="mt-4 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-base">add</span>Thêm bài viết mới
            </button>
          </div>
        )}
      </div>

      {/* ── Editor Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-8 px-4 overflow-y-auto pb-8" onClick={() => setEditing(null)}>
          <div className="bg-surface rounded-2xl w-full max-w-3xl organic-shadow border border-outline-variant overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-5 border-b border-outline-variant flex items-center justify-between">
              <div>
                <h2 className="font-h3 text-h3 text-on-surface">{editing.ma_bai_viet ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h2>
                <p className="text-body-sm text-on-surface-variant mt-0.5">{editing.ma_bai_viet ? `ID: ${editing.ma_bai_viet}` : 'Tạo bài viết mới'}</p>
              </div>
              <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
              <label className="grid gap-2">
                <span className="text-label-sm font-bold text-on-surface-variant">Tiêu đề <span className="text-error">*</span></span>
                <input value={editing.tieu_de} onChange={e => setEditing({ ...editing, tieu_de: e.target.value })}
                  placeholder="Nhập tiêu đề bài viết..."
                  className="bg-white border border-outline-variant rounded-lg px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>
              <label className="grid gap-2">
                <span className="text-label-sm font-bold text-on-surface-variant">Tóm tắt</span>
                <textarea rows={2} value={editing.tom_tat || ''} onChange={e => setEditing({ ...editing, tom_tat: e.target.value })}
                  placeholder="Mô tả ngắn gọn..."
                  className="bg-white border border-outline-variant rounded-lg px-4 py-3 text-body-md resize-none focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>
              <label className="grid gap-2">
                <span className="text-label-sm font-bold text-on-surface-variant">Trạng thái</span>
                <select value={editing.trang_thai} onChange={e => setEditing({ ...editing, trang_thai: Number(e.target.value) })}
                  className="bg-white border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none">
                  <option value={1}>Đã xuất bản</option>
                  <option value={0}>Bản nháp</option>
                </select>
              </label>
              <div className="grid gap-2">
                <span className="text-label-sm font-bold text-on-surface-variant">Hình ảnh bìa</span>
                {editing.hinh_anh ? (
                  <div className="relative rounded-lg overflow-hidden border border-outline-variant">
                    <img src={editing.hinh_anh.startsWith('/upload/') ? `http://localhost:5000${editing.hinh_anh}` : editing.hinh_anh} alt="Ảnh bìa" className="w-full h-48 object-cover" />
                    <button type="button" onClick={() => setEditing(prev => ({ ...prev, hinh_anh: '' }))}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-outline-variant rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                    {uploading ? (
                      <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">add_photo_alternate</span>
                        <span className="text-body-sm text-on-surface-variant mt-1">Chọn ảnh từ máy</span>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>
              <label className="grid gap-2">
                <span className="text-label-sm font-bold text-on-surface-variant">Nội dung (HTML) <span className="text-error">*</span></span>
                <div className="flex flex-wrap gap-1 p-2 bg-surface-container-low border border-outline-variant border-b-0 rounded-t-lg">
                  {[{ tag: 'p', icon: 'notes', lbl: 'Paragraph' }, { tag: 'h2', icon: 'format_h2', lbl: 'H2' }, { tag: 'h3', icon: 'format_h3', lbl: 'H3' }, { tag: 'bold', icon: 'format_bold', lbl: 'Bold' }, { tag: 'ul', icon: 'format_list_bulleted', lbl: 'List' }, { tag: 'img', icon: 'image', lbl: 'Image' }].map(b => (
                    <button key={b.tag} onClick={() => handleInsertTag(b.tag)} title={b.lbl}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-base">{b.icon}</span>
                    </button>
                  ))}
                </div>
                <textarea ref={editorRef} rows={12} value={editing.noi_dung} onChange={e => setEditing({ ...editing, noi_dung: e.target.value })}
                  placeholder="<h2>Tiêu đề mục</h2>&#10;<p>Nội dung bài viết...</p>"
                  className="bg-white border border-outline-variant rounded-b-lg resize-none px-4 py-3 text-body-md font-mono leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </label>
            </div>

            <div className="px-8 py-5 border-t border-outline-variant bg-surface-container-low flex justify-between items-center">
              <p className="text-body-sm">{msg && <span className="text-error">{msg}</span>}</p>
              <div className="flex gap-3">
                <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl border border-outline-variant font-bold text-body-sm hover:bg-surface-container transition-colors">Hủy</button>
                <button onClick={handleSave} disabled={saving}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-body-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50">
                  {saving ? <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Đang lưu...</> : <><span className="material-symbols-outlined text-base">save</span>{editing.ma_bai_viet ? 'Cập nhật' : 'Xuất bản'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
