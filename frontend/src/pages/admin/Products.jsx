import { useEffect, useState } from 'react';
import { api, categoryAPI, productAPI } from '../../services/api';
import { AlertCircle, Info, DollarSign, Timer, ImagePlus, Video, Save, Plus, Image as ImageIcon, Film, Download, Package, Eye, AlertTriangle } from 'lucide-react';
import { Badge, Btn, Input, Loading, Modal, PageHero, SearchBar, Select, StatCard } from '../../components/ui/AdminUI';
import ConfirmModal from '../../components/ConfirmModal';
import * as XLSX from 'xlsx';

const emptyForm = {
  ten_san_pham: '', mo_ta: '', gia_ban: 0, don_vi: 'kg', ton_kho: 0, ma_danh_muc: '', hinh_anh: [], video: [],
  han_su_dung: '', ngay_san_xuat: '', so_ngay_can_han: 3, phan_tram_giam_can_han: 0,
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
        ngay_san_xuat: form.ngay_san_xuat || null,
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
        {error && (
          <div className="flex items-center gap-3 rounded-btn border border-red-200 bg-red-50 px-5 py-3.5 text-body text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Section 1: Basic Info */}
        <div className="rounded-card border border-border bg-card p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3 pb-2 border-b border-border/50">
            <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-primary/10 text-primary"><Info size={20} /></span>
            <h3 className="text-h3 text-text-primary">Thông tin cơ bản</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Tên sản phẩm" placeholder="Nhập tên sản phẩm..." value={form.ten_san_pham} onChange={e => setForm({ ...form, ten_san_pham: e.target.value })} />
            <Select label="Danh mục" value={form.ma_danh_muc} onChange={e => setForm({ ...form, ma_danh_muc: e.target.value })}>
              <option value="">Chọn danh mục</option>
              {categories.map(item => <option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-body text-text-secondary">Mô tả sản phẩm</label>
            <textarea rows={3} placeholder="Mô tả ngắn gọn về sản phẩm..." value={form.mo_ta} onChange={e => setForm({ ...form, mo_ta: e.target.value })} className="w-full resize-none rounded-btn border border-border bg-card px-4 py-3 text-body text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors" />
          </div>
        </div>

        {/* Section 2: Price & Stock */}
        <div className="rounded-card border border-border bg-card p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3 pb-2 border-b border-border/50">
            <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-amber-100 text-amber-600"><DollarSign size={20} /></span>
            <h3 className="text-h3 text-text-primary">Giá bán & Kho hàng</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Giá bán (VNĐ)" type="number" min="0" placeholder="0" value={form.gia_ban} onChange={e => setForm({ ...form, gia_ban: e.target.value })} />
            <Input label="Đơn vị tính" placeholder="kg, hộp, chai..." value={form.don_vi} onChange={e => setForm({ ...form, don_vi: e.target.value })} />
            <Input label="Số lượng tồn kho" type="number" min="0" placeholder="0" value={form.ton_kho} onChange={e => setForm({ ...form, ton_kho: e.target.value })} />
          </div>
        </div>

        {/* Section 3: HSD & Alerts */}
        <div className="rounded-card border border-border bg-card p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3 pb-2 border-b border-border/50">
            <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-violet-100 text-violet-600"><Timer size={20} /></span>
            <h3 className="text-h3 text-text-primary">Hạn sử dụng & Cảnh báo</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Ngày sản xuất" type="date" max={form.han_su_dung ? form.han_su_dung.slice(0, 10) : undefined} value={form.ngay_san_xuat ? form.ngay_san_xuat.slice(0, 10) : ''} onChange={e => setForm({ ...form, ngay_san_xuat: e.target.value || null })} />
            <Input label="Hạn sử dụng" type="date" min={form.ngay_san_xuat ? form.ngay_san_xuat.slice(0, 10) : undefined} value={form.han_su_dung ? form.han_su_dung.slice(0, 10) : ''} onChange={e => setForm({ ...form, han_su_dung: e.target.value || null })} />
            <Input label="Cảnh báo trước (số ngày)" type="number" min="0" value={form.so_ngay_can_han} onChange={e => setForm({ ...form, so_ngay_can_han: Number(e.target.value) || 0 })} />
            <Input label="Giảm giá khi gần hết hạn (%)" type="number" min="0" max="100" value={form.phan_tram_giam_can_han} onChange={e => setForm({ ...form, phan_tram_giam_can_han: Number(e.target.value) || 0 })} />
          </div>
        </div>

        {/* Section 4: Images */}
        <div className="rounded-card border border-border bg-card p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-primary/10 text-primary"><ImagePlus size={20} /></span>
              <h3 className="text-h3 text-text-primary">Hình ảnh sản phẩm</h3>
              {form.hinh_anh.length > 0 && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary">{form.hinh_anh.length}</span>}
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-caption font-semibold text-white hover:bg-primary/80 active:scale-95 transition-all shadow-sm">
              <ImagePlus size={16} />
              {uploading ? 'Đang tải...' : 'Thêm ảnh'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </label>
          </div>
          {!form.hinh_anh.length ? (
            <div className="rounded-btn border-2 border-dashed border-border/50 py-12 text-center hover:border-primary/40 transition-colors">
              <ImageIcon size={48} className="mx-auto text-text-secondary/20" />
              <p className="mt-3 text-caption text-text-secondary/60">Kéo thả hoặc nhấn "Thêm ảnh" để tải ảnh lên</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {form.hinh_anh.map((image, index) => (
                <div key={`${index}-${image.slice(0, 20)}`} className="group relative overflow-hidden rounded-btn border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <img src={image.startsWith('/upload/') ? `http://localhost:5000${image}` : image} alt={`Ảnh ${index + 1}`} className="h-32 w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, hinh_anh: prev.hinh_anh.filter((_, i) => i !== index) }))} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-danger text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white">×</button>
                  {index === 0 && <span className="absolute left-2 bottom-2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">Ảnh chính</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Videos */}
        <div className="rounded-card border border-border bg-card p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-violet-100 text-violet-600"><Film size={20} /></span>
              <h3 className="text-h3 text-text-primary">Video sản phẩm</h3>
              {form.video.length > 0 && <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[12px] font-medium text-violet-600">{form.video.length}</span>}
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-caption font-semibold text-white hover:bg-violet-700 active:scale-95 transition-all shadow-sm">
              <Film size={16} />
              {uploading ? 'Đang tải...' : 'Thêm video'}
              <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoFiles} />
            </label>
          </div>
          {!form.video.length ? (
            <div className="rounded-btn border-2 border-dashed border-border/50 py-12 text-center hover:border-violet-400/40 transition-colors">
              <Video size={48} className="mx-auto text-text-secondary/20" />
              <p className="mt-3 text-caption text-text-secondary/60">Kéo thả hoặc nhấn "Thêm video" để tải video lên</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {form.video.map((video, index) => (
                <div key={`v-${index}-${video.slice(0, 20)}`} className="group relative overflow-hidden rounded-btn border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <video src={video.startsWith('/upload/') ? `http://localhost:5000${video}` : video} className="h-32 w-full object-cover" controls />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, video: prev.video.filter((_, i) => i !== index) }))} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-danger text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Btn className="flex-1 justify-center !py-3.5 !text-body !font-bold shadow-md hover:shadow-lg" disabled={saving || uploading}>
            {isEdit ? <Save size={18} /> : <Plus size={18} />}
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
          </Btn>
          <Btn type="button" variant="outline" className="flex-1 justify-center !py-3.5" onClick={onClose}>Hủy</Btn>
        </div>
      </form>
    </Modal>
  );
}

function ProductCard({ product, onEdit, onToggle, onDelete }) {
  return (
    <div className="bg-card rounded-card border border-border shadow-card overflow-hidden">
      <img src={product.images?.[0] ? (product.images[0].startsWith('/upload/') ? `http://localhost:5000${product.images[0]}` : product.images[0]) : 'https://placehold.co/400x300/b1f0ce/0f5238?text=NS'} className="w-full aspect-[4/3] object-cover" alt={product.ten_san_pham} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-secondary truncate">{product.ten_danh_muc}</p>
            <h3 className="mt-1 text-body font-bold text-text-primary truncate">{product.ten_san_pham}</h3>
          </div>
          <Badge 
            text={!product.con_hoat_dong ? 'Đã ẩn' : (product.ton_kho <= 0 ? 'Hết hàng' : 'Đang bán')} 
            color={!product.con_hoat_dong ? 'gray' : (product.ton_kho <= 0 ? 'red' : 'green')} 
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-btn bg-background p-2">
            <p className="text-[12px] font-medium text-text-secondary">Giá bán</p>
            <p className="text-body font-bold text-primary truncate">{Number(product.gia_ban || 0).toLocaleString('vi-VN')}₫/{product.don_vi}</p>
          </div>
          <div className="rounded-btn bg-background p-2">
            <p className="text-[12px] font-medium text-text-secondary">Tồn kho</p>
            <p className="text-body font-bold text-text-primary">{product.ton_kho}</p>
          </div>
        </div>
        {product.han_su_dung && (
          <div className="mt-2 rounded-btn bg-background p-2">
            <p className="text-[12px] font-medium text-text-secondary">Hạn sử dụng</p>
            <div className="flex items-center gap-2">
              <p className="text-body font-bold text-text-primary">{new Date(product.han_su_dung).toLocaleDateString('vi-VN')}</p>
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
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', confirmText: 'Đồng ý', type: 'danger', onConfirm: null });

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
    setConfirmModal({
      open: true,
      title: 'Xác nhận xóa sản phẩm',
      message: 'Bạn có chắc muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa sản phẩm',
      type: 'danger',
      onConfirm: async () => {
        await productAPI.delete(id);
        setProducts(prev => prev.filter(item => item.ma_san_pham !== id));
      },
    });
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
      <div className="bg-card rounded-card p-5 border border-border shadow-card">
        <div className="flex gap-3 items-center">
          <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Tìm tên sản phẩm..." /></div>
          <Btn variant="outline" onClick={exportExcel} disabled={!products.length}>
            <Download size={16} className="mr-1" /> Xuất Excel
          </Btn>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<Package size={20} />} label="Tổng sản phẩm" value={summary.total} color="green" />
        <StatCard icon={<Eye size={20} />} label="Đang hiển thị" value={summary.active} color="blue" />
        <StatCard icon={<AlertTriangle size={20} />} label="Hết hàng" value={summary.outOfStock} color="orange" />
      </div>
      {loading ? <Loading /> : products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {products.map(product => <ProductCard key={product.ma_san_pham} product={product} onEdit={handleEdit} onToggle={toggleProduct} onDelete={deleteProduct} />)}
        </div>
      ) : (
        <div className="bg-card rounded-card py-16 text-center border border-dashed border-border">
          <Package size={48} className="mx-auto text-text-secondary/30" />
          <p className="mt-3 text-body text-text-secondary">Chưa có sản phẩm nào.</p>
        </div>
      )}
      {editingProduct !== null && (
        <ProductFormModal categories={categories} initialData={editingProduct.ma_san_pham ? editingProduct : null} onClose={() => setEditingProduct(null)} onDone={() => { setEditingProduct(null); fetchData(); }} />
      )}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}
