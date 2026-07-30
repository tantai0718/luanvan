import { useEffect, useState } from 'react';
import { api, seasonAPI } from '../../services/api';
import { Badge, Btn, Input, Loading, Modal, PageHero, Table } from '../../components/ui/AdminUI';

const emptyForm = { ten_mua: '', thang_bat_dau: 1, thang_ket_thuc: 3, qua_nam: 0, mo_ta: '' };
const emptyProductForm = { masp: '', so_luong_du_kien: '', gia_du_kien: '', ghi_chu: '', han_su_dung_dieu_chinh: '' };

function SeasonProductsModal({ season, products, allProducts, loading, form, setForm, saving, onClose, onAdd, onRemove }) {
  const attachedIds = new Set(products.map(p => p.masp));
  const selectableProducts = allProducts.filter(p => !attachedIds.has(p.ma_san_pham));

  return (
    <Modal title={`Sản phẩm trong mùa: ${season?.ten_mua || ''}`} onClose={onClose} size="xl">
      <div className="space-y-6">
        <div className="bg-background rounded-btn p-4 space-y-3">
          <p className="text-body font-semibold text-text-primary">Gắn sản phẩm mới vào mùa này</p>
          
          <div className="space-y-3">
            {/* Hàng 1: Chọn sản phẩm - Số lượng dự kiến - Giá dự kiến */}
            <div className="grid gap-3 md:grid-cols-3">
              <select
                value={form.masp}
                onChange={e => setForm({ ...form, masp: e.target.value })}
                className="bg-card border border-border rounded-btn px-4 py-2.5 text-body focus:ring-2 focus:ring-primary outline-none w-full"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {selectableProducts.map(p => (
                  <option key={p.ma_san_pham} value={p.ma_san_pham}>{p.ten_san_pham}</option>
                ))}
              </select>
              <Input 
                placeholder="Số lượng dự kiến" 
                type="number" 
                value={form.so_luong_du_kien} 
                onChange={e => setForm({ ...form, so_luong_du_kien: e.target.value })} 
              />
              <Input 
                placeholder="Giá dự kiến (đ)" 
                type="number" 
                value={form.gia_du_kien} 
                onChange={e => setForm({ ...form, gia_du_kien: e.target.value })} 
              />
            </div>

            {/* Hàng 2: Ghi chú - HSD điều chỉnh */}
            <div className="grid gap-3 md:grid-cols-3">
              <Input 
                placeholder="Ghi chú" 
                value={form.ghi_chu} 
                onChange={e => setForm({ ...form, ghi_chu: e.target.value })} 
              />
              <Input 
                placeholder="HSD điều chỉnh (ngày)" 
                type="date" 
                value={form.han_su_dung_dieu_chinh ? form.han_su_dung_dieu_chinh.slice(0, 10) : ''} 
                onChange={e => setForm({ ...form, han_su_dung_dieu_chinh: e.target.value || '' })} 
              />
            </div>
          </div>

          <Btn onClick={onAdd} disabled={saving || !form.masp}>
            {saving ? 'Đang lưu...' : '+ Gắn sản phẩm'}
          </Btn>
        </div>

        {loading ? <Loading /> : (
          <Table headers={['#', 'Sản phẩm', 'Giá bán', 'Giá dự kiến mùa', 'SL dự kiến', 'HSD điều chỉnh', 'Ghi chú', 'Thao tác']} empty={{ icon: '🌱', text: 'Mùa này chưa có sản phẩm nào.' }}>
            {products.map((product, index) => (
              <tr key={product.maspmv} className="hover:bg-background">
                <td className="px-4 py-3 text-caption text-text-secondary">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={product.hinh_anh ? `http://localhost:5000${product.hinh_anh}` : 'https://placehold.co/48x48/b1f0ce/0f5238?text=NS'} alt={product.ten_san_pham} className="h-12 w-12 rounded-xl object-cover" />
                    <p className="text-body font-semibold text-text-primary">{product.ten_san_pham}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-body text-text-secondary">{Number(product.gia_ban).toLocaleString('vi-VN')}đ/{product.don_vi}</td>
                <td className="px-4 py-3 text-body font-bold text-primary">{product.gia_du_kien ? `${product.gia_du_kien.toLocaleString('vi-VN')}đ` : '—'}</td>
                <td className="px-4 py-3 text-body text-text-secondary">{product.so_luong_du_kien ?? '—'}</td>
                <td className="px-4 py-3 text-body text-text-secondary">{product.han_su_dung_dieu_chinh ? new Date(product.han_su_dung_dieu_chinh).toLocaleDateString('vi-VN') : '—'}</td>
                <td className="px-4 py-3 text-body text-text-secondary">{product.ghi_chu || '—'}</td>
                <td className="px-4 py-3">
                  <Btn size="sm" variant="danger" onClick={() => onRemove(product.masp)}>Gỡ</Btn>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </Modal>
  );
}

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [selectedSeason, setSelectedSeason] = useState(null);
  const [seasonProducts, setSeasonProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [savingProduct, setSavingProduct] = useState(false);

  const fetchSeasons = async () => {
    setLoading(true); setError('');
    try { const data = await seasonAPI.getAll(); setSeasons(data.seasons || []); }
    catch (err) { setSeasons([]); setError(err.message || 'Không tải được mùa vụ.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSeasons(); }, []);

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = season => { setForm({ ...season }); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'add') await seasonAPI.create(form);
      else await seasonAPI.update(form.mamv, form);
      setModal(null); fetchSeasons();
    } catch (err) { setError(err.message || 'Không lưu được mùa vụ.'); }
    finally { setSaving(false); }
  };

  const toggleSeason = async (id, current) => {
    try { await seasonAPI.toggle(id); setSeasons(prev => prev.map(item => (item.mamv === id ? { ...item, trang_thai: current ? 0 : 1 } : item))); }
    catch (err) { setError(err.message || 'Không cập nhật được trạng thái mùa vụ.'); }
  };

  const deleteSeason = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa mùa vụ này không?')) return;
    try { await seasonAPI.remove(id); fetchSeasons(); }
    catch (err) { setError(err.message || 'Không xóa được mùa vụ.'); }
  };

  const openProducts = async season => {
    setSelectedSeason(season); setProductsLoading(true); setProductForm(emptyProductForm);
    try {
      const [productsData, allData] = await Promise.all([
        seasonAPI.getProducts(season.mamv),
        api.get('/admin/products'),
      ]);
      setSeasonProducts(productsData.products || []);
      setAllProducts(allData.products || []);
    } catch (err) {
      setSeasonProducts([]); setAllProducts([]);
      setError(err.message || 'Không tải được sản phẩm của mùa vụ.');
    } finally { setProductsLoading(false); }
  };

  const handleAddProduct = async () => {
    setSavingProduct(true); setError('');
    try {
      await seasonAPI.addProduct(selectedSeason.mamv, productForm);
      setProductForm(emptyProductForm);
      openProducts(selectedSeason);
      fetchSeasons();
    } catch (err) { setError(err.message || 'Không gắn được sản phẩm.'); }
    finally { setSavingProduct(false); }
  };

  const handleRemoveProduct = async masp => {
    if (!window.confirm('Gỡ sản phẩm này khỏi mùa vụ?')) return;
    try {
      await seasonAPI.removeProduct(selectedSeason.mamv, masp);
      setSeasonProducts(prev => prev.filter(p => p.masp !== masp));
      fetchSeasons();
    } catch (err) { setError(err.message || 'Không gỡ được sản phẩm.'); }
  };

  const monthLabel = (start, end, quaNam) => quaNam ? `Tháng ${start} → Tháng ${end} (năm sau)` : `Tháng ${start} → Tháng ${end}`;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Mùa vụ"
        title="Quản lý mùa vụ nông sản"
        body="Khai báo các mùa trong năm và gắn sản phẩm phù hợp để chatbot AI gợi ý đúng theo mùa."
        actions={<Btn onClick={openAdd}>+ Thêm mùa vụ</Btn>}
      />
      {error && <div className="bg-card rounded-card p-5 border border-border text-body text-red-700 bg-red-50">{error}</div>}

      {loading ? <Loading /> : (
        <Table headers={['#', 'Tên mùa vụ', 'Khoảng thời gian', 'Số sản phẩm', 'Trạng thái', 'Hành động']} empty={{ icon: '🌾', text: 'Chưa có mùa vụ nào.' }}>
          {seasons.map((season, index) => (
            <tr key={season.mamv} className="hover:bg-background">
              <td className="px-4 py-3 text-caption text-text-secondary">{index + 1}</td>
              <td className="px-4 py-3">
                <button onClick={() => openProducts(season)} className="text-left text-body font-semibold text-text-primary hover:text-primary">{season.ten_mua}</button>
                <p className="mt-1 text-caption text-text-secondary">Bấm để quản lý sản phẩm thuộc mùa này</p>
              </td>
              <td className="px-4 py-3 text-body text-text-secondary">{monthLabel(season.thang_bat_dau, season.thang_ket_thuc, season.qua_nam)}</td>
              <td className="px-4 py-3 text-body text-text-secondary">{season.so_san_pham}</td>
              <td className="px-4 py-3"><Badge text={season.trang_thai ? 'Đang áp dụng' : 'Đã tắt'} color={season.trang_thai ? 'green' : 'gray'} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Btn size="sm" variant="ghost" onClick={() => openProducts(season)}>Xem sản phẩm</Btn>
                  <Btn size="sm" variant="outline" onClick={() => openEdit(season)}>Sửa</Btn>
                  <Btn size="sm" variant={season.trang_thai ? 'ghost' : 'primary'} onClick={() => toggleSeason(season.mamv, season.trang_thai)}>{season.trang_thai ? 'Tắt' : 'Bật'}</Btn>
                  <Btn size="sm" variant="danger" onClick={() => deleteSeason(season.mamv)}>Xóa</Btn>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Thêm mùa vụ' : 'Sửa mùa vụ'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Input label="Tên mùa vụ" value={form.ten_mua} onChange={e => setForm({ ...form, ten_mua: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Tháng bắt đầu (1-12)" type="number" min="1" max="12" value={form.thang_bat_dau} onChange={e => setForm({ ...form, thang_bat_dau: e.target.value })} />
              <Input label="Tháng kết thúc (1-12)" type="number" min="1" max="12" value={form.thang_ket_thuc} onChange={e => setForm({ ...form, thang_ket_thuc: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-body text-text-secondary">
              <input type="checkbox" checked={!!form.qua_nam} onChange={e => setForm({ ...form, qua_nam: e.target.checked ? 1 : 0 })} />
              Mùa vụ vắt qua năm (ví dụ tháng 11 → tháng 3 năm sau)
            </label>
            <Input label="Mô tả" value={form.mo_ta} onChange={e => setForm({ ...form, mo_ta: e.target.value })} />
            <div className="flex gap-3">
              <Btn className="flex-1 justify-center" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu mùa vụ'}</Btn>
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setModal(null)}>Đóng</Btn>
            </div>
          </div>
        </Modal>
      )}

      {selectedSeason && (
        <SeasonProductsModal
          season={selectedSeason}
          products={seasonProducts}
          allProducts={allProducts}
          loading={productsLoading}
          form={productForm}
          setForm={setProductForm}
          saving={savingProduct}
          onClose={() => setSelectedSeason(null)}
          onAdd={handleAddProduct}
          onRemove={handleRemoveProduct}
        />
      )}
    </div>
  );
}
