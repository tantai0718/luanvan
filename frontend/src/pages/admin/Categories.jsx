import { useEffect, useState } from 'react';
import { api, productAPI } from '../../services/api';
import { Badge, Btn, Input, Loading, Modal, Table } from '../../components/ui/AdminUI';

const EMPTY_FORM = {
  ten_danh_muc: '',
  duong_dan: '',
  bieu_tuong: '🥦',
  thu_tu: 0,
  con_hoat_dong: 1,
};

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

function CategoryProductsModal({ category, products, loading, onClose, onToggle, onDelete }) {
  return (
    <Modal title={`Sản phẩm trong danh mục: ${category?.ten_danh_muc || ''}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Đang quản lý <b>{products.length}</b> sản phẩm thuộc danh mục <b>{category?.ten_danh_muc}</b>.
        </div>

        {loading ? (
          <Loading />
        ) : (
          <Table
            headers={['#', 'Sản phẩm', 'Nông trại', 'Giá bán', 'Tồn kho', 'Trạng thái', 'Thao tác']}
            empty={{ icon: '🥬', text: 'Danh mục này chưa có sản phẩm nào' }}
          >
            {products.map((product, index) => {
              const image = product.images?.[0];
              const isLowStock = Number(product.ton_kho) <= Number(product.ton_kho_toi_thieu || 0);

              return (
                <tr key={product.ma_san_pham} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-400">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {image ? (
                        <img src={image} alt={product.ten_san_pham} className="h-10 w-10 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-base">🥬</div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{product.ten_san_pham}</p>
                        <p className="text-xs text-gray-400">Đơn vị: {product.don_vi}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.ten_nong_trai || product.ten_nong_dan || 'Chưa cập nhật'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-700">{formatCurrency(product.gia_ban)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${isLowStock ? 'text-orange-500' : 'text-gray-700'}`}>
                      {product.ton_kho}
                      {isLowStock && ' ⚠'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge text={product.con_hoat_dong ? 'Đang hiển thị' : 'Đã ẩn'} color={product.con_hoat_dong ? 'green' : 'gray'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Btn size="sm" variant={product.con_hoat_dong ? 'outline' : 'primary'} onClick={() => onToggle(product.ma_san_pham)}>
                        {product.con_hoat_dong ? 'Ẩn' : 'Hiện'}
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => onDelete(product.ma_san_pham)}>
                        Xóa
                      </Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}

        <div className="flex justify-end">
          <Btn variant="outline" onClick={onClose}>Đóng</Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.get('/admin/categories');
      setCategories(data.categories || []);
    } catch (err) {
      setCategories([]);
      setError(err.message || 'Không tải được danh mục.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setError('');
    setModal('add');
  };

  const openEdit = category => {
    setForm({ ...category });
    setError('');
    setModal('edit');
  };

  const openProducts = async category => {
    setSelectedCategory(category);
    setCategoryProducts([]);
    setProductsLoading(true);

    try {
      const data = await api.get(`/admin/categories/${category.ma_danh_muc}/products`);
      setCategoryProducts(data.products || []);
    } catch (err) {
      setCategoryProducts([]);
      setError(err.message || 'Không tải được sản phẩm của danh mục.');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      if (modal === 'add') {
        await api.post('/admin/categories', form);
      } else {
        await api.put(`/admin/categories/${form.ma_danh_muc}`, form);
      }

      setModal(null);
      fetchData();
    } catch (err) {
      setError(err.message || 'Không lưu được danh mục.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này không?')) return;

    try {
      await api.delete(`/admin/categories/${id}`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Không xóa được danh mục.');
    }
  };

  const toggleCategoryActive = async (id, current) => {
    try {
      await api.patch(`/admin/categories/${id}/toggle`);
      setCategories(prev =>
        prev.map(category =>
          category.ma_danh_muc === id ? { ...category, con_hoat_dong: !current } : category
        )
      );
    } catch (err) {
      setError(err.message || 'Không cập nhật được trạng thái danh mục.');
    }
  };

  const handleToggleProduct = async id => {
    try {
      await productAPI.toggle(id);
      setCategoryProducts(prev =>
        prev.map(product =>
          product.ma_san_pham === id ? { ...product, con_hoat_dong: !product.con_hoat_dong } : product
        )
      );
    } catch (err) {
      setError(err.message || 'Không cập nhật được trạng thái sản phẩm.');
    }
  };

  const handleDeleteProduct = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này không?')) return;

    try {
      await productAPI.delete(id);
      setCategoryProducts(prev => prev.filter(product => product.ma_san_pham !== id));
    } catch (err) {
      setError(err.message || 'Không xóa được sản phẩm.');
    }
  };

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Tổng: <b>{categories.length}</b> danh mục
        </p>
        <Btn onClick={openAdd}>+ Thêm danh mục</Btn>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <Table
          headers={['#', 'Biểu tượng', 'Tên danh mục', 'Đường dẫn', 'Thứ tự', 'Trạng thái', 'Hành động']}
          empty={{ icon: '📂', text: 'Chưa có danh mục nào' }}
        >
          {categories.map((category, index) => (
            <tr key={category.ma_danh_muc} className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-3 text-xs text-gray-400">{index + 1}</td>
              <td className="px-4 py-3 text-2xl">{category.bieu_tuong}</td>
              <td className="px-4 py-3">
                <button onClick={() => openProducts(category)} className="text-left text-sm font-semibold text-gray-800 hover:text-green-700">
                  {category.ten_danh_muc}
                </button>
                <p className="mt-1 text-xs text-gray-400">Bấm để xem sản phẩm thuộc danh mục này</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{category.duong_dan}</td>
              <td className="px-4 py-3 text-xs text-gray-500">{category.thu_tu}</td>
              <td className="px-4 py-3">
                <Badge text={category.con_hoat_dong ? 'Đang hiển thị' : 'Đã ẩn'} color={category.con_hoat_dong ? 'green' : 'gray'} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Btn size="sm" variant="ghost" onClick={() => openProducts(category)}>
                    Xem sản phẩm
                  </Btn>
                  <Btn size="sm" variant="outline" onClick={() => openEdit(category)}>
                    Sửa
                  </Btn>
                  <Btn size="sm" variant={category.con_hoat_dong ? 'ghost' : 'primary'} onClick={() => toggleCategoryActive(category.ma_danh_muc, category.con_hoat_dong)}>
                    {category.con_hoat_dong ? 'Ẩn' : 'Hiện'}
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => handleDeleteCategory(category.ma_danh_muc)}>
                    Xóa
                  </Btn>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Thêm danh mục' : 'Sửa danh mục'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Tên danh mục *" value={form.ten_danh_muc} onChange={event => updateField('ten_danh_muc', event.target.value)} placeholder="Rau củ" />
              <Input label="Biểu tượng" value={form.bieu_tuong} onChange={event => updateField('bieu_tuong', event.target.value)} placeholder="🥦" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Đường dẫn URL" value={form.duong_dan} onChange={event => updateField('duong_dan', event.target.value)} placeholder="rau-cu" />
              <Input label="Thứ tự" type="number" value={form.thu_tu} onChange={event => updateField('thu_tu', Number(event.target.value))} />
            </div>

            <label className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!form.con_hoat_dong}
                onChange={event => updateField('con_hoat_dong', event.target.checked ? 1 : 0)}
                className="h-4 w-4 accent-green-600"
              />
              Hiển thị danh mục này
            </label>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Btn className="flex-1 justify-center" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Btn>
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setModal(null)}>
                Hủy
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {selectedCategory && (
        <CategoryProductsModal
          category={selectedCategory}
          products={categoryProducts}
          loading={productsLoading}
          onClose={() => setSelectedCategory(null)}
          onToggle={handleToggleProduct}
          onDelete={handleDeleteProduct}
        />
      )}
    </div>
  );
}
