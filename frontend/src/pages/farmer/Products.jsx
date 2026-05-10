import { useEffect, useMemo, useState } from 'react';
import { categoryAPI, productAPI } from '../../services/api';
import { Badge, Btn, Loading, Modal, Select, StatCard } from '../../components/ui/AdminUI';

const EMPTY_FORM = {
  ten_san_pham: '',
  mo_ta: '',
  gia_ban: 0,
  don_vi: 'kg',
  ton_kho: 0,
  ton_kho_toi_thieu: 10,
  ma_danh_muc: '',
  hinh_anh: [],
};

const FALLBACK_IMAGE = 'https://placehold.co/400x260/e8f5e9/2e7d32?text=S%E1%BA%A3n+ph%E1%BA%A9m';

const readFileAsDataUrl = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}`));
    reader.readAsDataURL(file);
  });

const buildProductPayload = form => ({
  ...form,
  gia_ban: Number(form.gia_ban),
  ton_kho: Number(form.ton_kho),
  ton_kho_toi_thieu: Number(form.ton_kho_toi_thieu),
  ma_danh_muc: Number(form.ma_danh_muc),
  hinh_anh: form.hinh_anh,
});

function ProductImagePicker({ images, uploading, onFilesChange, onRemove }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Hình ảnh sản phẩm</label>
          <p className="mt-1 text-xs text-gray-400">Chọn ảnh từ máy, xem trước và xóa từng ảnh trước khi lưu.</p>
        </div>
        <label className={`inline-flex cursor-pointer items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
          {uploading ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}
          <input type="file" accept="image/*" multiple className="hidden" onChange={onFilesChange} disabled={uploading} />
        </label>
      </div>

      {!images.length ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
          Chưa có ảnh nào được chọn
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div key={`${index}-${image.slice(0, 20)}`} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              <img src={image} alt={`Sản phẩm ${index + 1}`} className="h-28 w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute right-2 top-2 h-7 w-7 rounded-full bg-white/90 text-sm font-bold text-red-500 shadow-sm hover:bg-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductFormModal({ categories, initialData, onClose, onDone }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...initialData,
    hinh_anh: initialData?.images || [],
  }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleFilesChange = async event => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError('');

    try {
      const imageUrls = await Promise.all(files.map(readFileAsDataUrl));
      setForm(prev => ({ ...prev, hinh_anh: [...prev.hinh_anh, ...imageUrls] }));
    } catch (err) {
      setError(err.message || 'Không tải được ảnh');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = imageIndex => {
    setForm(prev => ({
      ...prev,
      hinh_anh: prev.hinh_anh.filter((_, index) => index !== imageIndex),
    }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = buildProductPayload(form);
      if (initialData?.ma_san_pham) {
        await productAPI.update(initialData.ma_san_pham, payload);
      } else {
        await productAPI.create(payload);
      }
      onDone();
    } catch (err) {
      setError(err.message || 'Không lưu được sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={initialData?.ma_san_pham ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tên sản phẩm</label>
            <input
              value={form.ten_san_pham}
              onChange={event => updateField('ten_san_pham', event.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>

          <Select
            label="Danh mục"
            value={form.ma_danh_muc}
            onChange={event => updateField('ma_danh_muc', event.target.value)}
            required
          >
            <option value="">Chọn danh mục</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea
            value={form.mo_ta}
            onChange={event => updateField('mo_ta', event.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Giá bán</label>
            <input
              type="number"
              min="0"
              value={form.gia_ban}
              onChange={event => updateField('gia_ban', event.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Đơn vị</label>
            <input
              value={form.don_vi}
              onChange={event => updateField('don_vi', event.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tồn kho</label>
            <input
              type="number"
              min="0"
              value={form.ton_kho}
              onChange={event => updateField('ton_kho', event.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Mức tối thiểu</label>
            <input
              type="number"
              min="0"
              value={form.ton_kho_toi_thieu}
              onChange={event => updateField('ton_kho_toi_thieu', event.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>

        <ProductImagePicker
          images={form.hinh_anh}
          uploading={uploading}
          onFilesChange={handleFilesChange}
          onRemove={removeImage}
        />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <Btn type="submit" variant="primary" size="lg" className="flex-1 justify-center" disabled={saving || uploading}>
            {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
          </Btn>
          <Btn type="button" variant="outline" size="lg" className="flex-1 justify-center" onClick={onClose}>
            Đóng
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function ProductCard({ product, onEdit, onToggle, onDelete }) {
  const previewImage = product.images?.[0] || FALLBACK_IMAGE;
  const isLowStock = Number(product.ton_kho) <= Number(product.ton_kho_toi_thieu);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <img src={previewImage} alt={product.ten_san_pham} className="h-44 w-full object-cover" />

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-800">{product.ten_san_pham}</h2>
            <p className="mt-1 text-xs text-gray-400">{product.ten_danh_muc}</p>
          </div>
          <Badge text={product.con_hoat_dong ? 'Đang bán' : 'Đã ẩn'} color={product.con_hoat_dong ? 'green' : 'gray'} />
        </div>

        <p className="min-h-[40px] line-clamp-2 text-sm text-gray-500">{product.mo_ta || 'Chưa có mô tả'}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400">Giá bán</p>
            <p className="font-semibold text-green-700">{Number(product.gia_ban).toLocaleString('vi-VN')}₫/{product.don_vi}</p>
          </div>

          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400">Tồn kho</p>
            <p className={`font-semibold ${isLowStock ? 'text-orange-600' : 'text-gray-700'}`}>
              {product.ton_kho} {isLowStock && '⚠️'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Btn variant="outline" size="sm" className="flex-1 justify-center" onClick={() => onEdit(product)}>
            Sửa
          </Btn>
          <Btn variant={product.con_hoat_dong ? 'ghost' : 'primary'} size="sm" className="flex-1 justify-center" onClick={() => onToggle(product.ma_san_pham)}>
            {product.con_hoat_dong ? 'Ẩn' : 'Hiện'}
          </Btn>
          <Btn variant="danger" size="sm" className="justify-center" onClick={() => onDelete(product.ma_san_pham)}>
            Xóa
          </Btn>
        </div>
      </div>
    </div>
  );
}

export default function FarmerProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        productAPI.myProducts(),
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
  }, []);

  const summary = useMemo(() => ({
    total: products.length,
    active: products.filter(product => product.con_hoat_dong).length,
    low: products.filter(product => Number(product.ton_kho) <= Number(product.ton_kho_toi_thieu)).length,
  }), [products]);

  const handleToggle = async productId => {
    await productAPI.toggle(productId);
    setProducts(prev =>
      prev.map(product =>
        product.ma_san_pham === productId
          ? { ...product, con_hoat_dong: !product.con_hoat_dong }
          : product
      )
    );
  };

  const handleDelete = async productId => {
    if (!window.confirm('Xóa sản phẩm này?')) return;

    await productAPI.delete(productId);
    setProducts(prev => prev.filter(product => product.ma_san_pham !== productId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sản phẩm của tôi</h1>
            <p className="mt-1 text-sm text-gray-500">Thêm, sửa và ẩn hiện sản phẩm trong gian hàng.</p>
          </div>
          <Btn variant="primary" size="lg" onClick={() => setEditingProduct({})}>+ Thêm sản phẩm</Btn>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard icon="🥬" label="Tổng sản phẩm" value={summary.total} color="green" />
          <StatCard icon="✅" label="Đang hiển thị" value={summary.active} color="blue" />
          <StatCard icon="⚠️" label="Sắp hết hàng" value={summary.low} color="orange" />
        </div>

        {loading ? (
          <Loading />
        ) : !products.length ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center text-gray-400">
            <div className="mb-3 text-5xl">🥬</div>
            <p className="font-medium">Bạn chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map(product => (
              <ProductCard
                key={product.ma_san_pham}
                product={product}
                onEdit={setEditingProduct}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {editingProduct !== null && (
        <ProductFormModal
          categories={categories}
          initialData={editingProduct.ma_san_pham ? editingProduct : null}
          onClose={() => setEditingProduct(null)}
          onDone={() => {
            setEditingProduct(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
