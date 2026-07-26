import { useEffect, useState } from 'react';
import { api, categoryAPI, productAPI } from '../../services/api';
import { Badge, Btn, Input, Loading, Modal, PageHero, SearchBar, Select, StatCard } from '../../components/ui/AdminUI';
import * as XLSX from 'xlsx';

const emptyForm = {
  ten_san_pham: '', mo_ta: '', gia_ban: 0, don_vi: 'kg', ton_kho: 0, ma_danh_muc: '', hinh_anh: [], video: [],
  han_su_dung: '', so_ngay_can_han: 3, phan_tram_giam_can_han: 0,
};

const readFileAsDataUrl = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}`));
    reader.readAsDataURL(file);
  });

function ProductFormModal({ categories, initialData, onClose, onDone }) {
  const isEdit = !!initialData?.ma_san_pham;
  const [form, setForm] = useState({
    ...emptyForm, ...initialData,
    hinh_anh: (initialData?.images || []).filter(img => !img.includes('.mp4') && !img.includes('.webm')),
    video: (initialData?.images || []).filter(img => img.includes('.mp4') || img.includes('.webm')),
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async event => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true); setError('');
    try {
      const images = await Promise.all(files.map(readFileAsDataUrl));
      setForm(prev => ({ ...prev, hinh_anh: [...prev.hinh_anh, ...images] }));
    } catch (err) { setError(err.message || 'Không tải được ảnh.'); }
    finally { setUploading(false); event.target.value = ''; }
  };

  const handleVideoFiles = async event => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true); setError('');
    try {
      const videos = await Promise.all(files.map(readFileAsDataUrl));
      setForm(prev => ({ ...prev, video: [...prev.video, ...videos] }));
    } catch (err) { setError(err.message || 'Không tải được video.'); }
    finally { setUploading(false); event.target.value = ''; }
  };

  const handleSave = async event => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        ten_san_pham: form.ten_san_pham,
        mo_ta: form.mo_ta,
        gia_ban: Number(form.gia_ban),
        don_vi: form.don_vi,
        ton_kho: Number(form.ton_kho),
        ma_danh_muc: Number(form.ma_danh_muc),
        han_su_dung: form.han_su_dung || null,
        so_ngay_can_han: Number(form.so_ngay_can_han) || 0,
        phan_tram_giam_can_han: Number(form.phan_tram_giam_can_han) || 0,
        hinh_anh: form.hinh_anh,
        video: form.video,
      };
      if (isEdit) await productAPI.update(initialData.ma_san_pham, payload);
      else await productAPI.create({ ...payload, hinh_anh: [...payload.hinh_anh, ...payload.video] });
      onDone();
    } catch (err) { setError(err.message || 'Không lưu được sản phẩm.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'} onClose={onClose} size="lg">
      <form onSubmit={handleSave} className="space-y-6">
        {error && <div className="rounded-2xl border border-error-container bg-error-container/20 px-4 py-3 text-body-md text-on-error-container">{error}</div>}

        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 space-y-4">
          <h3 className="text-title-sm font-title-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">info</span>
            Thông tin cơ bản
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Tên sản phẩm" placeholder="Nhập tên sản phẩm..." value={form.ten_san_pham} onChange={e => setForm({ ...form, ten_san_pham: e.target.value })} />
            <Select label="Danh mục" value={form.ma_danh_muc} onChange={e => setForm({ ...form, ma_danh_muc: e.target.value })}>
              <option value="">Chọn danh mục</option>
              {categories.map(item => <option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-body-md font-body-md text-on-surface-variant">Mô tả sản phẩm</label>
            <textarea rows={3} placeholder="Mô tả ngắn gọn về sản phẩm..." value={form.mo_ta} onChange={e => setForm({ ...form, mo_ta: e.target.value })} className="w-full resize-none rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed" />
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 space-y-4">
          <h3 className="text-title-sm font-title-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">payments</span>
            Giá bán & Kho hàng
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Giá bán (VNĐ)" type="number" min="0" placeholder="0" value={form.gia_ban} onChange={e => setForm({ ...form, gia_ban: e.target.value })} />
            <Input label="Đơn vị tính" placeholder="kg, hộp, chai..." value={form.don_vi} onChange={e => setForm({ ...form, don_vi: e.target.value })} />
            <Input label="Số lượng tồn kho" type="number" min="0" placeholder="0" value={form.ton_kho} onChange={e => setForm({ ...form, ton_kho: e.target.value })} />
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 space-y-4">
          <h3 className="text-title-sm font-title-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">timer</span>
            Hạn sử dụng & Cảnh báo
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Hạn sử dụng" type="date" value={form.han_su_dung ? form.han_su_dung.slice(0, 10) : ''} onChange={e => setForm({ ...form, han_su_dung: e.target.value || null })} />
            <Input label="Cảnh báo trước (số ngày)" type="number" min="0" value={form.so_ngay_can_han} onChange={e => setForm({ ...form, so_ngay_can_han: Number(e.target.value) || 0 })} />
            <Input label="Giảm giá khi gần hết hạn (%)" type="number" min="0" max="100" value={form.phan_tram_giam_can_han} onChange={e => setForm({ ...form, phan_tram_giam_can_han: Number(e.target.value) || 0 })} />
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 space-y-4">
          <h3 className="text-title-sm font-title-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">photo_library</span>
            Hình ảnh sản phẩm
            <span className="text-label-sm text-on-surface-variant font-normal ml-1">({form.hinh_anh.length} ảnh)</span>
          </h3>
          <div className="flex items-center justify-end">
            <label className="cursor-pointer rounded-full bg-primary-fixed px-4 py-2 text-label-sm font-semibold text-on-primary-fixed-variant hover:bg-primary-fixed-dim transition-all">
              <span className="material-symbols-outlined text-sm align-middle mr-1">add_photo_alternate</span>
              {uploading ? 'Đang tải...' : 'Thêm ảnh mới'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </label>
          </div>
          {!form.hinh_anh.length ? (
            <div className="rounded-2xl border-2 border-dashed border-outline-variant py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">image</span>
              <p className="mt-2 text-label-sm text-on-surface-variant">Chưa có ảnh nào. Nhấn nút "Thêm ảnh mới" để bắt đầu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {form.hinh_anh.map((image, index) => (
                <div key={`${index}-${image.slice(0, 20)}`} className="group relative overflow-hidden rounded-2xl border border-outline-variant">
                  <img src={image.startsWith('/upload/') ? `http://localhost:5000${image}` : image} alt={`Ảnh ${index + 1}`} className="h-28 w-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, hinh_anh: prev.hinh_anh.filter((_, i) => i !== index) }))} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface text-sm font-bold text-error opacity-0 group-hover:opacity-100 transition-opacity shadow-md">×</button>
                  {index === 0 && <span className="absolute left-2 bottom-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Ảnh chính</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 space-y-4">
          <h3 className="text-title-sm font-title-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">videocam</span>
            Video sản phẩm
            <span className="text-label-sm text-on-surface-variant font-normal ml-1">({form.video.length} video)</span>
          </h3>
          <div className="flex items-center justify-end">
            <label className="cursor-pointer rounded-full bg-primary-fixed px-4 py-2 text-label-sm font-semibold text-on-primary-fixed-variant hover:bg-primary-fixed-dim transition-all">
              <span className="material-symbols-outlined text-sm align-middle mr-1">videocam</span>
              {uploading ? 'Đang tải...' : 'Thêm video mới'}
              <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoFiles} />
            </label>
          </div>
          {!form.video.length ? (
            <div className="rounded-2xl border-2 border-dashed border-outline-variant py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">movie</span>
              <p className="mt-2 text-label-sm text-on-surface-variant">Chưa có video nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {form.video.map((video, index) => (
                <div key={`v-${index}-${video.slice(0, 20)}`} className="group relative overflow-hidden rounded-2xl border border-outline-variant">
                  <video src={video.startsWith('/upload/') ? `http://localhost:5000${video}` : video} className="h-28 w-full object-cover" controls />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, video: prev.video.filter((_, i) => i !== index) }))} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface text-sm font-bold text-error opacity-0 group-hover:opacity-100 transition-opacity shadow-md">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Btn className="flex-1 justify-center" disabled={saving || uploading}>
            <span className="material-symbols-outlined text-sm mr-1">{isEdit ? 'save' : 'add'}</span>
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
          </Btn>
          <Btn type="button" variant="outline" className="flex-1 justify-center" onClick={onClose}>Hủy</Btn>
        </div>
      </form>
    </Modal>
  );
}

function ProductCard({ product, onEdit, onToggle, onDelete }) {
  return (
    <div className="bg-surface rounded-3xl border border-outline-variant organic-shadow overflow-hidden">
      <img src={product.images?.[0] ? (product.images[0].startsWith('/upload/') ? `http://localhost:5000${product.images[0]}` : product.images[0]) : 'https://placehold.co/400x300/b1f0ce/0f5238?text=NS'} className="w-full aspect-[4/3] object-cover" alt={product.ten_san_pham} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"> {/* Thêm chống tràn chữ */}
            <p className="text-label-xs uppercase tracking-[0.12em] text-on-surface-variant truncate">{product.ten_danh_muc}</p>
            <h3 className="mt-1 text-body-md font-bold text-on-surface truncate">{product.ten_san_pham}</h3>
          </div>
          <Badge text={product.con_hoat_dong ? 'Đang bán' : 'Đã ẩn'} color={product.con_hoat_dong ? 'green' : 'gray'} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-surface-container-low p-2">
            <p className="text-label-xs text-on-surface-variant">Giá bán</p>
            <p className="text-label-md font-bold text-primary truncate">{Number(product.gia_ban || 0).toLocaleString('vi-VN')}₫/{product.don_vi}</p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-2">
            <p className="text-label-xs text-on-surface-variant">Tồn kho</p>
            <p className="text-label-md font-bold text-on-surface">{product.ton_kho}</p>
          </div>
        </div>
        {product.han_su_dung && (
          <div className="mt-2 rounded-xl bg-surface-container-low p-2">
            <p className="text-label-xs text-on-surface-variant">Hạn sử dụng</p>
            <div className="flex items-center gap-2">
              <p className="text-label-md font-bold text-on-surface">{new Date(product.han_su_dung).toLocaleDateString('vi-VN')}</p>
              <Badge text={product.trang_thai_hsd === 'het_han' ? 'Hết hạn' : product.trang_thai_hsd === 'can_han' ? 'Sắp hết hạn' : 'Còn hạn'} color={product.trang_thai_hsd === 'het_han' ? 'red' : product.trang_thai_hsd === 'can_han' ? 'orange' : 'green'} />
            </div>
          </div>
        )}


        <div className="mt-4 flex gap-2">
          <Btn size="sm" variant="outline" className="flex-1 justify-center" onClick={() => onEdit(product)}>Sửa</Btn>
          <Btn size="sm" variant={product.con_hoat_dong ? 'ghost' : 'primary'} className="flex-1 justify-center" onClick={() => onToggle(product.ma_san_pham)}>{product.con_hoat_dong ? 'Ẩn' : 'Hiện'}</Btn>
          <Btn size="sm" variant="danger" onClick={() => onDelete(product.ma_san_pham)}>Xóa</Btn>
        </div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      const [productResponse, categoryResponse] = await Promise.all([
        api.get(`/admin/products${params.toString() ? `?${params.toString()}` : ''}`),
        categoryAPI.getAll(),
      ]);
      setProducts(productResponse.products || []);
      const cats = categoryResponse.categories || categoryResponse || [];
      setCategories(cats.filter(c => c.loai === 'san_pham'));
    } catch { setProducts([]); setCategories([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search]);

  const summary = {
    total: products.length,
    active: products.filter(item => item.con_hoat_dong).length,
    outOfStock: products.filter(item => Number(item.ton_kho) <= 0).length,
  };

  const handleEdit = async product => {
    try {
      const data = await productAPI.getById(product.ma_san_pham);
      setEditingProduct(data.product || product);
    } catch {
      setEditingProduct(product);
    }
  };

  const toggleProduct = async id => {
    await productAPI.toggle(id);
    setProducts(prev => prev.map(item => (item.ma_san_pham === id ? { ...item, con_hoat_dong: !item.con_hoat_dong } : item)));
  };

  const deleteProduct = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này không?')) return;
    await productAPI.delete(id);
    setProducts(prev => prev.filter(item => item.ma_san_pham !== id));
  };

  const exportExcel = async () => {
    const data = products.map((p, i) => ({
      'STT': i + 1,
      'Tên sản phẩm': p.ten_san_pham,
      'Danh mục': p.ten_danh_muc,
      'Giá bán': Number(p.gia_ban || 0),
      'Đơn vị': p.don_vi,
      'Tồn kho': p.ton_kho,
      'Hạn sử dụng': p.han_su_dung ? new Date(p.han_su_dung).toLocaleDateString('vi-VN') : '',
      'Trạng thái HSD': p.han_su_dung ? (p.trang_thai_hsd === 'het_han' ? 'Hết hạn' : p.trang_thai_hsd === 'can_han' ? 'Sắp hết hạn' : 'Còn hạn') : '',
      'Trạng thái': p.con_hoat_dong ? 'Đang bán' : 'Đã ẩn',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'San pham');

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const fileName = `san_pham_${dd}-${mm}-${yyyy}.xlsx`;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({ suggestedName: fileName, types: [{ description: 'Excel file', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }] });
        const bin = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([bin], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (e) { if (e.name !== 'AbortError') alert('Không thể lưu file.'); }
    } else {
      XLSX.writeFile(wb, fileName);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Sản phẩm" title="Quản lý toàn bộ sản phẩm đang bán" body="Admin trực tiếp thêm, sửa, ẩn hoặc xóa sản phẩm trong mô hình quản lý tập trung của hệ thống." actions={<Btn onClick={() => setEditingProduct({})}>+ Thêm sản phẩm</Btn>} />
      <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
        <div className="flex gap-3 items-center">
          <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Tìm tên sản phẩm..." /></div>
          <Btn variant="outline" onClick={exportExcel} disabled={!products.length}>
            <span className="material-symbols-outlined text-sm mr-1">download</span> Xuất Excel
          </Btn>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<span className="material-symbols-outlined">inventory_2</span>} label="Tổng sản phẩm" value={summary.total} color="green" />
        <StatCard icon={<span className="material-symbols-outlined">visibility</span>} label="Đang hiển thị" value={summary.active} color="blue" />
        <StatCard icon={<span className="material-symbols-outlined">error_outline</span>} label="Hết hàng" value={summary.outOfStock} color="orange" />
      </div>
      {loading ? <Loading /> : products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {products.map(product => <ProductCard key={product.ma_san_pham} product={product} onEdit={handleEdit} onToggle={toggleProduct} onDelete={deleteProduct} />)}
        </div>
      ) : (
        <div className="bg-surface rounded-3xl py-16 text-center border border-dashed border-outline-variant">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">inventory_2</span>
          <p className="mt-3 text-body-md text-on-surface-variant">Chưa có sản phẩm nào.</p>
        </div>
      )}
      {editingProduct !== null && (
        <ProductFormModal categories={categories} initialData={editingProduct.ma_san_pham ? editingProduct : null} onClose={() => setEditingProduct(null)} onDone={() => { setEditingProduct(null); fetchData(); }} />
      )}
    </div>
  );
}
