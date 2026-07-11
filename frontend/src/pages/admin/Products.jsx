import { useEffect, useState } from 'react';
import { api, categoryAPI, productAPI } from '../../services/api';
import { Badge, Btn, Input, Loading, Modal, PageHero, SearchBar, Select, StatCard } from '../../components/ui/AdminUI';

const emptyForm = {
  ten_san_pham: '', mo_ta: '', gia_ban: 0, don_vi: 'kg', ton_kho: 0, ma_danh_muc: '', hinh_anh: [], video: [],
};

const readFileAsDataUrl = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}`));
    reader.readAsDataURL(file);
  });

function ProductFormModal({ categories, initialData, onClose, onDone }) {
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
      const payload = { ...form, hinh_anh: [...form.hinh_anh, ...form.video], gia_ban: Number(form.gia_ban), ton_kho: Number(form.ton_kho), ma_danh_muc: Number(form.ma_danh_muc) };
      if (initialData?.ma_san_pham) await productAPI.update(initialData.ma_san_pham, payload);
      else await productAPI.create(payload);
      onDone();
    } catch (err) { setError(err.message || 'Không lưu được sản phẩm.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={initialData?.ma_san_pham ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'} onClose={onClose} size="lg">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Tên sản phẩm" value={form.ten_san_pham} onChange={e => setForm({ ...form, ten_san_pham: e.target.value })} />
          <Select label="Danh mục" value={form.ma_danh_muc} onChange={e => setForm({ ...form, ma_danh_muc: e.target.value })}>
            <option value="">Chọn danh mục</option>
            {categories.map(item => <option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-body-md font-body-md text-on-surface-variant">Mô tả</label>
          <textarea rows={4} value={form.mo_ta} onChange={e => setForm({ ...form, mo_ta: e.target.value })} className="w-full resize-none rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Giá bán" type="number" value={form.gia_ban} onChange={e => setForm({ ...form, gia_ban: e.target.value })} />
          <Input label="Đơn vị" value={form.don_vi} onChange={e => setForm({ ...form, don_vi: e.target.value })} />
          <Input label="Tồn kho" type="number" value={form.ton_kho} onChange={e => setForm({ ...form, ton_kho: e.target.value })} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-body-md font-body-md text-on-surface-variant">Hình ảnh sản phẩm</label>
            <label className="cursor-pointer rounded-full bg-primary-fixed px-4 py-2 text-label-sm font-semibold text-on-primary-fixed-variant hover:bg-primary-fixed-dim">
              {uploading ? 'Đang tải...' : 'Chọn ảnh từ máy'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </label>
          </div>
          {!form.hinh_anh.length ? (
            <div className="rounded-2xl border border-dashed border-outline-variant py-8 text-center text-label-sm text-on-surface-variant">Chưa có ảnh nào được chọn.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {form.hinh_anh.map((image, index) => (
                <div key={`${index}-${image.slice(0, 16)}`} className="relative overflow-hidden rounded-2xl border border-outline-variant">
                  <img src={image.startsWith('/upload/') ? `http://localhost:5000${image}` : image} alt={`Ảnh ${index + 1}`} className="h-28 w-full object-cover" />
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, hinh_anh: prev.hinh_anh.filter((_, i) => i !== index) }))} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface text-sm font-bold text-error">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-body-md font-body-md text-on-surface-variant">Video sản phẩm</label>
            <label className="cursor-pointer rounded-full bg-primary-fixed px-4 py-2 text-label-sm font-semibold text-on-primary-fixed-variant hover:bg-primary-fixed-dim">
              {uploading ? 'Đang tải...' : 'Chọn video từ máy'}
              <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoFiles} />
            </label>
          </div>
          {!form.video.length ? (
            <div className="rounded-2xl border border-dashed border-outline-variant py-8 text-center text-label-sm text-on-surface-variant">Chưa có video nào được chọn.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {form.video.map((video, index) => (
                <div key={`v-${index}-${video.slice(0, 16)}`} className="relative overflow-hidden rounded-2xl border border-outline-variant">
                  <video src={video} className="h-28 w-full object-cover" controls />
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, video: prev.video.filter((_, i) => i !== index) }))} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface text-sm font-bold text-error">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {error && <div className="rounded-2xl border border-error-container bg-error-container/20 px-4 py-3 text-body-md text-on-error-container">{error}</div>}
        <div className="flex gap-3">
          <Btn className="flex-1 justify-center" disabled={saving || uploading}>{saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</Btn>
          <Btn type="button" variant="outline" className="flex-1 justify-center" onClick={onClose}>Đóng</Btn>
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
        <p className="mt-2 line-clamp-1 text-label-sm text-on-surface-variant">{product.mo_ta || 'Chưa có mô tả.'}</p>
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
      setCategories(categoryResponse.categories || []);
    } catch { setProducts([]); setCategories([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search]);

  const summary = {
    total: products.length,
    active: products.filter(item => item.con_hoat_dong).length,
    outOfStock: products.filter(item => Number(item.ton_kho) <= 0).length,
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

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Sản phẩm" title="Quản lý toàn bộ sản phẩm đang bán" body="Admin trực tiếp thêm, sửa, ẩn hoặc xóa sản phẩm trong mô hình quản lý tập trung của hệ thống." actions={<Btn onClick={() => setEditingProduct({})}>+ Thêm sản phẩm</Btn>} />
      <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
        <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên sản phẩm..." />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<span className="material-symbols-outlined">inventory_2</span>} label="Tổng sản phẩm" value={summary.total} color="green" />
        <StatCard icon={<span className="material-symbols-outlined">visibility</span>} label="Đang hiển thị" value={summary.active} color="blue" />
        <StatCard icon={<span className="material-symbols-outlined">error_outline</span>} label="Hết hàng" value={summary.outOfStock} color="orange" />
      </div>
      {loading ? <Loading /> : products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {products.map(product => <ProductCard key={product.ma_san_pham} product={product} onEdit={setEditingProduct} onToggle={toggleProduct} onDelete={deleteProduct} />)}
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
