import { useEffect, useState } from 'react';
import { api, productAPI } from '../../services/api';
import { Badge, Btn, Input, Loading, Modal, PageHero, Table } from '../../components/ui/AdminUI';

const emptyForm = {
  ten_danh_muc: '',
  duong_dan: '',
  bieu_tuong: '🥬',
  thu_tu: 0,
  con_hoat_dong: 1,
};

function CategoryProductsModal({ category, products, loading, onClose, onToggle, onDelete }) {
  return (
    <Modal title={`Sản phẩm trong danh mục: ${category?.ten_danh_muc || ''}`} onClose={onClose} size="xl">
      {loading ? (
        <Loading />
      ) : (
        <Table
          headers={['#', 'Sản phẩm', 'Nguồn hàng', 'Giá', 'Tồn kho', 'Trạng thái', 'Thao tác']}
          empty={{ icon: '🥬', text: 'Danh mục này chưa có sản phẩm.' }}
        >
          {products.map((product, index) => (
            <tr key={product.ma_san_pham} className="hover:bg-[#f9fbf9]">
              <td className="px-4 py-3 text-xs text-slate-400">{index + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={product.images?.[0] || 'https://placehold.co/48x48/e8f5ee/1a7a4a?text=NS'}
                    alt={product.ten_san_pham}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{product.ten_san_pham}</p>
                    <p className="text-xs text-slate-400">Đơn vị: {product.don_vi}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {product.ten_nong_trai || product.ten_nong_dan || 'Cửa hàng Nông Sản Việt'}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-[#1a7a4a]">
                {Number(product.gia_ban || 0).toLocaleString('vi-VN')}₫
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{product.ton_kho}</td>
              <td className="px-4 py-3">
                <Badge text={product.con_hoat_dong ? 'Đang hiển thị' : 'Đã ẩn'} color={product.con_hoat_dong ? 'green' : 'gray'} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Btn size="sm" variant={product.con_hoat_dong ? 'ghost' : 'primary'} onClick={() => onToggle(product.ma_san_pham)}>
                    {product.con_hoat_dong ? 'Ẩn' : 'Hiện'}
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => onDelete(product.ma_san_pham)}>
                    Xóa
                  </Btn>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Modal>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const fetchCategories = async () => {
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
    fetchCategories();
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setModal('add');
  };

  const openEdit = category => {
    setForm({ ...category });
    setModal('edit');
  };

  const openProducts = async category => {
    setSelectedCategory(category);
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
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Không lưu được danh mục.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = async (id, current) => {
    try {
      await api.patch(`/admin/categories/${id}/toggle`);
      setCategories(prev => prev.map(item => (item.ma_danh_muc === id ? { ...item, con_hoat_dong: !current } : item)));
    } catch (err) {
      setError(err.message || 'Không cập nhật được trạng thái danh mục.');
    }
  };

  const deleteCategory = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này không?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Không xóa được danh mục.');
    }
  };

  const toggleProduct = async id => {
    try {
      await productAPI.toggle(id);
      setCategoryProducts(prev => prev.map(item => (item.ma_san_pham === id ? { ...item, con_hoat_dong: !item.con_hoat_dong } : item)));
    } catch (err) {
      setError(err.message || 'Không cập nhật được trạng thái sản phẩm.');
    }
  };

  const deleteProduct = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này không?')) return;
    try {
      await productAPI.delete(id);
      setCategoryProducts(prev => prev.filter(item => item.ma_san_pham !== id));
    } catch (err) {
      setError(err.message || 'Không xóa được sản phẩm.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Danh mục"
        title="Quản lý nhóm sản phẩm đang dùng trên hệ thống"
        body="Admin có thể thêm, sửa, ẩn hoặc xóa danh mục, đồng thời xem nhanh toàn bộ sản phẩm thuộc từng danh mục."
        actions={<Btn onClick={openAdd}>+ Thêm danh mục</Btn>}
      />

      {error ? <div className="market-panel px-5 py-4 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <Loading />
      ) : (
        <Table
          headers={['#', 'Biểu tượng', 'Tên danh mục', 'Đường dẫn', 'Thứ tự', 'Trạng thái', 'Hành động']}
          empty={{ icon: '🗂️', text: 'Chưa có danh mục nào.' }}
        >
          {categories.map((category, index) => (
            <tr key={category.ma_danh_muc} className="hover:bg-[#f9fbf9]">
              <td className="px-4 py-3 text-xs text-slate-400">{index + 1}</td>
              <td className="px-4 py-3 text-2xl">{category.bieu_tuong}</td>
              <td className="px-4 py-3">
                <button onClick={() => openProducts(category)} className="text-left font-semibold text-slate-900 hover:text-[#1a7a4a]">
                  {category.ten_danh_muc}
                </button>
                <p className="mt-1 text-xs text-slate-400">Bấm để quản lý sản phẩm thuộc danh mục này</p>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{category.duong_dan}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{category.thu_tu}</td>
              <td className="px-4 py-3">
                <Badge text={category.con_hoat_dong ? 'Đang hiển thị' : 'Đã ẩn'} color={category.con_hoat_dong ? 'green' : 'gray'} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Btn size="sm" variant="ghost" onClick={() => openProducts(category)}>Xem sản phẩm</Btn>
                  <Btn size="sm" variant="outline" onClick={() => openEdit(category)}>Sửa</Btn>
                  <Btn size="sm" variant={category.con_hoat_dong ? 'ghost' : 'primary'} onClick={() => toggleCategory(category.ma_danh_muc, category.con_hoat_dong)}>
                    {category.con_hoat_dong ? 'Ẩn' : 'Hiện'}
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => deleteCategory(category.ma_danh_muc)}>Xóa</Btn>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {modal ? (
        <Modal title={modal === 'add' ? 'Thêm danh mục' : 'Sửa danh mục'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Tên danh mục" value={form.ten_danh_muc} onChange={event => setForm({ ...form, ten_danh_muc: event.target.value })} />
              <Input label="Biểu tượng" value={form.bieu_tuong} onChange={event => setForm({ ...form, bieu_tuong: event.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Đường dẫn" value={form.duong_dan} onChange={event => setForm({ ...form, duong_dan: event.target.value })} />
              <Input label="Thứ tự" type="number" value={form.thu_tu} onChange={event => setForm({ ...form, thu_tu: Number(event.target.value) })} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl bg-[#f3f7f4] px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={!!form.con_hoat_dong}
                onChange={event => setForm({ ...form, con_hoat_dong: event.target.checked ? 1 : 0 })}
              />
              Hiển thị danh mục này
            </label>
            <div className="flex gap-3">
              <Btn className="flex-1 justify-center" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu danh mục'}
              </Btn>
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setModal(null)}>
                Đóng
              </Btn>
            </div>
          </div>
        </Modal>
      ) : null}

      {selectedCategory ? (
        <CategoryProductsModal
          category={selectedCategory}
          products={categoryProducts}
          loading={productsLoading}
          onClose={() => setSelectedCategory(null)}
          onToggle={toggleProduct}
          onDelete={deleteProduct}
        />
      ) : null}
    </div>
  );
}
