import { useEffect, useState } from 'react';
import { promotionAPI } from '../../services/api';
import { Badge, Btn, Input, Loading, Modal, PageHero, Table } from '../../components/ui/AdminUI';

const emptyForm = {
  ten_km: '',
  loai_uu_dai: 'giam_theo_so_luong',
  dieu_kien_toi_thieu: 10,
  phan_tram_giam: 5,
  gia_tri_giam_toi_da: '',
  ap_dung_cho: 'thuong_va_dat_truoc',
  trang_thai: 1,
};

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPromotions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await promotionAPI.adminAll();
      setPromotions(data.promotions || []);
    } catch (err) {
      setPromotions([]);
      setError(err.message || 'Không tải được danh sách khuyến mãi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setModal('add');
  };

  const openEdit = promo => {
    setForm({
      ...promo,
      gia_tri_giam_toi_da: promo.gia_tri_giam_toi_da || '',
      phan_tram_giam: promo.phan_tram_giam || '',
    });
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (modal === 'add') {
        await promotionAPI.create(form);
      } else {
        await promotionAPI.update(form.makm, form);
      }
      setModal(null);
      fetchPromotions();
    } catch (err) {
      setError(err.message || 'Không lưu được khuyến mãi.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await promotionAPI.toggleStatus(id);
      fetchPromotions();
    } catch (err) {
      setError(err.message || 'Không cập nhật được trạng thái.');
    }
  };

  const deletePromo = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa chương trình khuyến mãi này không?')) return;
    try {
      await promotionAPI.remove(id);
      fetchPromotions();
    } catch (err) {
      setError(err.message || 'Không xóa được khuyến mãi.');
    }
  };

  const formatTarget = val => {
    if (val === 'dinh_ky') return 'Đăng ký giao định kỳ';
    if (val === 'thuong_va_dat_truoc') return 'Đơn thường & Đặt trước';
    return 'Tất cả đơn hàng';
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Khuyến mãi & Ưu đãi"
        title="Quản lý khuyến mãi tự động"
        body="Cấu hình các mức giảm giá theo số lượng sản phẩm, miễn phí vận chuyển cho đơn hàng thỏa điều kiện."
        actions={<Btn onClick={openAdd}>+ Thêm khuyến mãi</Btn>}
      />

      {error && (
        <div className="bg-surface rounded-3xl p-lg border border-outline-variant text-body-md text-on-error-container bg-error-container/20">
          {error}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <Table
          headers={['#', 'Tên chương trình', 'Loại ưu đãi', 'Điều kiện áp dụng', 'Mức giảm', 'Áp dụng cho', 'Trạng thái', 'Thao tác']}
          empty={{ icon: '🏷️', text: 'Chưa có chương trình khuyến mãi nào.' }}
        >
          {promotions.map((promo, index) => (
            <tr key={promo.makm} className="hover:bg-surface-container-low">
              <td className="px-4 py-3 text-label-sm text-on-surface-variant">{index + 1}</td>
              <td className="px-4 py-3 font-semibold text-on-surface">{promo.ten_km}</td>
              <td className="px-4 py-3">
                <Badge
                  text={promo.loai_uu_dai === 'giam_theo_so_luong' ? 'Giảm theo số lượng' : 'Miễn phí vận chuyển'}
                  color={promo.loai_uu_dai === 'giam_theo_so_luong' ? 'green' : 'blue'}
                />
              </td>
              <td className="px-4 py-3 text-body-md text-on-surface-variant">
                {promo.loai_uu_dai === 'giam_theo_so_luong'
                  ? `Từ ${Number(promo.dieu_kien_toi_thieu)} sản phẩm`
                  : `Đơn từ ${Number(promo.dieu_kien_toi_thieu).toLocaleString('vi-VN')}đ`}
              </td>
              <td className="px-4 py-3 font-bold text-primary">
                {promo.loai_uu_dai === 'giam_theo_so_luong'
                  ? `${promo.phan_tram_giam}%`
                  : 'Freeship (30.000đ)'}
              </td>
              <td className="px-4 py-3 text-body-md text-on-surface-variant">
                {formatTarget(promo.ap_dung_cho)}
              </td>
              <td className="px-4 py-3">
                <Badge
                  text={promo.trang_thai ? 'Hoạt động' : 'Tạm dừng'}
                  color={promo.trang_thai ? 'green' : 'gray'}
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Btn size="sm" variant="outline" onClick={() => openEdit(promo)}>Sửa</Btn>
                  <Btn
                    size="sm"
                    variant={promo.trang_thai ? 'ghost' : 'primary'}
                    onClick={() => toggleStatus(promo.makm)}
                  >
                    {promo.trang_thai ? 'Tắt' : 'Bật'}
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => deletePromo(promo.makm)}>Xóa</Btn>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {modal && (
        <Modal
          title={modal === 'add' ? 'Thêm khuyến mãi mới' : 'Sửa khuyến mãi'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <Input
              label="Tên chương trình khuyến mãi"
              value={form.ten_km}
              onChange={e => setForm({ ...form, ten_km: e.target.value })}
              placeholder="Ví dụ: Giảm 5% cho đơn từ 10 sản phẩm"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm font-bold text-on-surface-variant">Loại ưu đãi</label>
                <select
                  value={form.loai_uu_dai}
                  onChange={e => setForm({ ...form, loai_uu_dai: e.target.value })}
                  className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="giam_theo_so_luong">Giảm theo số lượng (% discount)</option>
                  <option value="mien_phi_ship">Miễn phí vận chuyển (Freeship)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm font-bold text-on-surface-variant">Áp dụng cho</label>
                <select
                  value={form.ap_dung_cho}
                  onChange={e => setForm({ ...form, ap_dung_cho: e.target.value })}
                  className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="thuong_va_dat_truoc">Đơn thường & Đặt trước</option>
                  <option value="dinh_ky">Đăng ký giao định kỳ</option>
                  <option value="tat_ca">Tất cả hình thức mua</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={form.loai_uu_dai === 'giam_theo_so_luong' ? 'Số lượng tối thiểu (sp)' : 'Giá trị đơn tối thiểu (VNĐ)'}
                type="number"
                value={form.dieu_kien_toi_thieu}
                onChange={e => setForm({ ...form, dieu_kien_toi_thieu: e.target.value })}
              />

              {form.loai_uu_dai === 'giam_theo_so_luong' && (
                <Input
                  label="Phần trăm giảm (%)"
                  type="number"
                  step="0.1"
                  value={form.phan_tram_giam}
                  onChange={e => setForm({ ...form, phan_tram_giam: e.target.value })}
                  placeholder="Ví dụ: 5 hoặc 8"
                />
              )}
            </div>

            {form.loai_uu_dai === 'giam_theo_so_luong' && (
              <Input
                label="Giá trị giảm tối đa (VNĐ) - Để trống nếu không giới hạn"
                type="number"
                value={form.gia_tri_giam_toi_da}
                onChange={e => setForm({ ...form, gia_tri_giam_toi_da: e.target.value })}
                placeholder="Ví dụ: 100000"
              />
            )}

            <label className="flex items-center gap-2 text-body-md text-on-surface-variant">
              <input
                type="checkbox"
                checked={!!form.trang_thai}
                onChange={e => setForm({ ...form, trang_thai: e.target.checked ? 1 : 0 })}
              />
              Kích hoạt ngay chương trình này
            </label>

            <div className="flex gap-3 pt-2">
              <Btn className="flex-1 justify-center" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu khuyến mãi'}
              </Btn>
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setModal(null)}>
                Hủy
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
