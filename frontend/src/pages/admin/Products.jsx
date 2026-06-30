import { useEffect, useState } from 'react';
import { api, categoryAPI, productAPI } from '../../services/api';
import { Badge, Btn, Input, Loading, Modal, PageHero, SearchBar, Select, StatCard } from '../../components/ui/AdminUI';

const emptyForm = {
  ten_san_pham: '',
  mo_ta: '',
  gia_ban: 0,
  don_vi: 'kg',
  ton_kho: 0,
  ma_danh_muc: '',
  hinh_anh: [],
  video: [],
};

const placeholderImage = 'https://placehold.co/400x300/e8f5ee/1a7a4a?text=San+Pham';

const readFileAsDataUrl = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}`));
    reader.readAsDataURL(file);
  });

function ProductFormModal({ categories, initialData, onClose, onDone }) {
  const [form, setForm] = useState({
    ...emptyForm,
    ...initialData,
    hinh_anh: (initialData?.images || []).filter(img => !img.includes('.mp4') && !img.includes('.webm')),
    video: (initialData?.images || []).filter(img => img.includes('.mp4') || img.includes('.webm')),
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async event => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const images = await Promise.all(files.map(readFileAsDataUrl));
      setForm(prev => ({ ...prev, hinh_anh: [...prev.hinh_anh, ...images] }));
    } catch (err) {
      setError(err.message || 'Không tải được ảnh.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };
  const handleVideoFiles = async event => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const videos = await Promise.all(files.map(readFileAsDataUrl));
      setForm(prev => ({ ...prev, video: [...prev.video, ...videos] }));
    } catch (err) {
      setError(err.message || 'Không tải được video.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };
  const handleSave = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        hinh_anh: [...form.hinh_anh, ...form.video],
        gia_ban: Number(form.gia_ban),
        ton_kho: Number(form.ton_kho),
        ma_danh_muc: Number(form.ma_danh_muc),
      };
      if (initialData?.ma_san_pham) {
        await productAPI.update(initialData.ma_san_pham, payload);
      } else {
        await productAPI.create(payload);
      }
      onDone();
    } catch (err) {
      setError(err.message || 'Không lưu được sản phẩm.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={initialData?.ma_san_pham ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'} onClose={onClose} size="lg">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Tên sản phẩm" value={form.ten_san_pham} onChange={event => setForm({ ...form, ten_san_pham: event.target.value })} />
          <Select label="Danh mục" value={form.ma_danh_muc} onChange={event => setForm({ ...form, ma_danh_muc: event.target.value })}>
            <option value="">Chọn danh mục</option>
            {categories.map(item => (
              <option key={item.id} value={item.id}>{item.icon} {item.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Mô tả</label>
          <textarea
            rows={4}
            value={form.mo_ta}
            onChange={event => setForm({ ...form, mo_ta: event.target.value })}
            className="w-full resize-none rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Giá bán" type="number" value={form.gia_ban} onChange={event => setForm({ ...form, gia_ban: event.target.value })} />
          <Input label="Đơn vị" value={form.don_vi} onChange={event => setForm({ ...form, don_vi: event.target.value })} />
          <Input label="Tồn kho" type="number" value={form.ton_kho} onChange={event => setForm({ ...form, ton_kho: event.target.value })} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Hình ảnh sản phẩm</label>
            <label className="cursor-pointer rounded-full bg-[#e8f5ee] px-4 py-2 text-sm font-semibold text-[#1a7a4a] hover:bg-[#dff0e7]">
              {uploading ? 'Đang tải...' : 'Chọn ảnh từ máy'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </label>
          </div>
          {!form.hinh_anh.length ? (
            <div className="rounded-2xl border border-dashed border-[#dce7df] py-8 text-center text-sm text-slate-400">
              Chưa có ảnh nào được chọn.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {form.hinh_anh.map((image, index) => (
                <div key={`${index}-${image.slice(0, 16)}`} className="relative overflow-hidden rounded-2xl border border-[#dce7df]">
                  <img
                    src={image.startsWith('/upload/') ? `http://localhost:5000${image}` : image}
                    alt={`Ảnh ${index + 1}`}
                    className="h-28 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, hinh_anh: prev.hinh_anh.filter((_, itemIndex) => itemIndex !== index) }))}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Video sản phẩm</label>
            <label className="cursor-pointer rounded-full bg-[#e8f5ee] px-4 py-2 text-sm font-semibold text-[#1a7a4a] hover:bg-[#dff0e7]">
              {uploading ? 'Đang tải...' : 'Chọn video từ máy'}
              <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoFiles} />
            </label>
          </div>
          {!form.video.length ? (
            <div className="rounded-2xl border border-dashed border-[#dce7df] py-8 text-center text-sm text-slate-400">
              Chưa có video nào được chọn.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {form.video.map((video, index) => (
                <div key={`v-${index}-${video.slice(0, 16)}`} className="relative overflow-hidden rounded-2xl border border-[#dce7df]">
                  <video src={video} className="h-28 w-full object-cover" controls />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, video: prev.video.filter((_, i) => i !== index) }))}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="flex gap-3">
          <Btn className="flex-1 justify-center" disabled={saving || uploading}>
            {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
          </Btn>
          <Btn type="button" variant="outline" className="flex-1 justify-center" onClick={onClose}>
            Đóng
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function ProductCard({ product, onEdit, onToggle, onDelete }) {
  return (
    <div className="market-panel overflow-hidden">
      <img src={
        product.images?.[0]
          ? (product.images[0].startsWith('/upload/')
            ? `http://localhost:5000${product.images[0]}`
            : product.images[0])
          : 'https://placehold.co/48x48/e8f5ee/1a7a4a?text=NS'
      } />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{product.ten_danh_muc}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{product.ten_san_pham}</h3>
          </div>
          <Badge text={product.con_hoat_dong ? 'Đang bán' : 'Đã ẩn'} color={product.con_hoat_dong ? 'green' : 'gray'} />
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-600">{product.mo_ta || 'Chưa có mô tả.'}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-[#f3f7f4] p-3">
            <p className="text-xs text-slate-400">Giá bán</p>
            <p className="font-semibold text-[#1a7a4a]">{Number(product.gia_ban || 0).toLocaleString('vi-VN')}₫ / {product.don_vi}</p>
          </div>
          <div className="rounded-2xl bg-[#f3f7f4] p-3">
            <p className="text-xs text-slate-400">Tồn kho</p>
            <p className="font-semibold text-slate-900">{product.ton_kho}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn size="sm" variant="outline" className="flex-1 justify-center" onClick={() => onEdit(product)}>Sửa</Btn>
          <Btn size="sm" variant={product.con_hoat_dong ? 'ghost' : 'primary'} className="flex-1 justify-center" onClick={() => onToggle(product.ma_san_pham)}>
            {product.con_hoat_dong ? 'Ẩn' : 'Hiện'}
          </Btn>
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
    } catch {
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

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
      <PageHero
        eyebrow="Sản phẩm"
        title="Quản lý toàn bộ sản phẩm đang bán"
        body="Admin trực tiếp thêm, sửa, ẩn hoặc xóa sản phẩm trong mô hình quản lý tập trung của hệ thống."
        actions={<Btn onClick={() => setEditingProduct({})}>+ Thêm sản phẩm</Btn>}
      />

      <div className="market-panel p-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên sản phẩm..." />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon="🥬" label="Tổng sản phẩm" value={summary.total} color="green" />
        <StatCard icon="👁️" label="Đang hiển thị" value={summary.active} color="blue" />
        <StatCard icon="⚠️" label="Hết hàng" value={summary.outOfStock} color="orange" />
      </div>

      {loading ? (
        <Loading />
      ) : products.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map(product => (
            <ProductCard
              key={product.ma_san_pham}
              product={product}
              onEdit={setEditingProduct}
              onToggle={toggleProduct}
              onDelete={deleteProduct}
            />
          ))}
        </div>
      ) : (
        <div className="market-panel py-16 text-center text-slate-400">
          <div className="mb-3 text-4xl">🥬</div>
          <p>Chưa có sản phẩm nào.</p>
        </div>
      )}

      {editingProduct !== null ? (
        <ProductFormModal
          categories={categories}
          initialData={editingProduct.ma_san_pham ? editingProduct : null}
          onClose={() => setEditingProduct(null)}
          onDone={() => {
            setEditingProduct(null);
            fetchData();
          }}
        />
      ) : null}
    </div>
  );
}
