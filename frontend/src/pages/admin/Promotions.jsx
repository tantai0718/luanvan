import { useEffect, useState } from 'react';
import { promotionAPI } from '../../services/api';
import { Badge, Btn, Input, Loading, Modal, PageHero, Table } from '../../components/ui/AdminUI';
import ConfirmModal from '../../components/ConfirmModal';

const emptyForm = {
  ten_km: '',
  ma_code: '',
  loai_uu_dai: 'giam_theo_so_luong',
  dieu_kien_toi_thieu: 10,
  phan_tram_giam: 5,
  gia_tri_giam_toi_da: '',
  ap_dung_cho: 'thuong_va_dat_truoc',
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  so_luong_toi_da: '',
  gioi_han_moi_user: 1,
  trang_thai: 1,
};

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const toDatetimeLocal = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', confirmText: 'Đồng ý', type: 'danger', onConfirm: null });

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
      ma_code: promo.ma_code || '',
      gia_tri_giam_toi_da: promo.gia_tri_giam_toi_da || '',
      phan_tram_giam: promo.phan_tram_giam || '',
      ngay_bat_dau: toDatetimeLocal(promo.ngay_bat_dau),
      ngay_ket_thuc: toDatetimeLocal(promo.ngay_ket_thuc),
      so_luong_toi_da: promo.so_luong_toi_da || '',
      gioi_han_moi_user: promo.gioi_han_moi_user ?? 1,
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
    setConfirmModal({
      open: true,
      title: 'Xác nhận xóa khuyến mãi',
      message: 'Bạn có chắc muốn xóa chương trình khuyến mãi này không? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa khuyến mãi',
      type: 'danger',
      onConfirm: async () => {
        try {
          await promotionAPI.remove(id);
          fetchPromotions();
        } catch (err) {
          setError(err.message || 'Không xóa được khuyến mãi.');
        }
      },
    });
  };

  const formatTarget = val => {
    if (val === 'dinh_ky') return 'Đăng ký giao định kỳ';
    if (val === 'thuong_va_dat_truoc') return 'Đơn thường & Đặt trước';
    return 'Tất cả đơn hàng';
  };

  const isCodeMode = !!form.ma_code?.trim();

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Khuyến mãi & Ưu đãi"
        title="Quản lý khuyến mãi"
        body="Cấu hình khuyến mãi tự động hoặc tạo mã code giảm giá cho sự kiện. Hệ thống tự chọn ưu đãi cao nhất, không cộng dồn."
        actions={<Btn onClick={openAdd}>+ Thêm khuyến mãi</Btn>}
      />

      {error && (
        <div className="bg-card rounded-card p-5 border border-border text-body text-red-700 bg-red-50">
          {error}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <Table
          headers={['#', 'Tên chương trình', 'Loại', 'Mã Code', 'Điều kiện', 'Mức giảm', 'Áp dụng cho', 'Hiệu lực', 'Đã dùng', 'Trạng thái', 'Thao tác']}
          empty={{ icon: '🏷️', text: 'Chưa có chương trình khuyến mãi nào.' }}
        >
          {promotions.map((promo, index) => (
            <tr key={promo.makm} className="hover:bg-background">
              <td className="px-4 py-3 text-caption text-text-secondary">{index + 1}</td>
              <td className="px-4 py-3 font-semibold text-text-primary max-w-[200px]">
                <span className="line-clamp-2">{promo.ten_km}</span>
              </td>
              <td className="px-4 py-3">
                <Badge
                  text={promo.loai_uu_dai === 'giam_theo_so_luong' ? 'Giảm %' : 'Freeship'}
                  color={promo.loai_uu_dai === 'giam_theo_so_luong' ? 'green' : 'blue'}
                />
              </td>
              <td className="px-4 py-3">
                {promo.ma_code ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold text-primary bg-primary/10 rounded-full px-2.5 py-1 tracking-wider">
                    {promo.ma_code}
                  </span>
                ) : (
                  <Badge text="Tự động" color="gray" />
                )}
              </td>
              <td className="px-4 py-3 text-body text-text-secondary">
                {promo.loai_uu_dai === 'giam_theo_so_luong'
                  ? `Từ ${Number(promo.dieu_kien_toi_thieu)} SP`
                  : `Đơn từ ${Number(promo.dieu_kien_toi_thieu).toLocaleString('vi-VN')}đ`}
              </td>
              <td className="px-4 py-3 font-bold text-primary">
                {promo.loai_uu_dai === 'giam_theo_so_luong'
                  ? `${promo.phan_tram_giam}%`
                  : 'Freeship'}
              </td>
              <td className="px-4 py-3 text-body text-text-secondary text-[12px]">
                {formatTarget(promo.ap_dung_cho)}
              </td>
              <td className="px-4 py-3 text-[12px] text-text-secondary">
                {promo.ngay_bat_dau || promo.ngay_ket_thuc ? (
                  <span>{formatDate(promo.ngay_bat_dau)} → {formatDate(promo.ngay_ket_thuc)}</span>
                ) : (
                  <span className="text-text-secondary/50">Không giới hạn</span>
                )}
              </td>
              <td className="px-4 py-3 text-body text-text-secondary">
                {promo.ma_code ? (
                  <span>{promo.da_su_dung || 0}{promo.so_luong_toi_da ? ` / ${promo.so_luong_toi_da}` : ''}</span>
                ) : '—'}
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
              placeholder="Ví dụ: Giảm 10% sự kiện Triển lãm 2026"
            />

            {/* ── MÃ CODE ── */}
            <div className="rounded-2xl border border-border bg-background/50 p-4 space-y-3">
              <span className="text-caption font-bold text-text-secondary flex items-center gap-1.5">
                🏷️ Mã Code giảm giá
                <span className="text-[11px] font-normal text-text-secondary/70">(bỏ trống = khuyến mãi tự động)</span>
              </span>
              <Input
                label="Mã Code"
                value={form.ma_code}
                onChange={e => setForm({ ...form, ma_code: e.target.value.toUpperCase() })}
                placeholder="VD: TRIEN2026, NONGSANSACH..."
              />

              {isCodeMode && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-caption font-bold text-text-secondary">Ngày bắt đầu</label>
                    <input
                      type="datetime-local"
                      value={form.ngay_bat_dau}
                      onChange={e => setForm({ ...form, ngay_bat_dau: e.target.value })}
                      className="bg-card border border-border rounded-btn px-4 py-2.5 text-body focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-caption font-bold text-text-secondary">Ngày kết thúc</label>
                    <input
                      type="datetime-local"
                      value={form.ngay_ket_thuc}
                      onChange={e => setForm({ ...form, ngay_ket_thuc: e.target.value })}
                      className="bg-card border border-border rounded-btn px-4 py-2.5 text-body focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              )}

              {isCodeMode && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Tổng lượt sử dụng tối đa"
                    type="number"
                    value={form.so_luong_toi_da}
                    onChange={e => setForm({ ...form, so_luong_toi_da: e.target.value })}
                    placeholder="Để trống = không giới hạn"
                  />
                  <Input
                    label="Giới hạn mỗi tài khoản"
                    type="number"
                    value={form.gioi_han_moi_user}
                    onChange={e => setForm({ ...form, gioi_han_moi_user: e.target.value })}
                    placeholder="Mặc định: 1"
                  />
                </div>
              )}

              {isCodeMode && (
                <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 text-[12px] text-text-secondary flex items-start gap-2">
                  <span>💡</span>
                  <span>
                    Mã code <strong>không cộng dồn</strong> với khuyến mãi tự động. Hệ thống tự so sánh và chọn mức giảm cao nhất cho khách hàng.
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-bold text-text-secondary">Loại ưu đãi</label>
                <select
                  value={form.loai_uu_dai}
                  onChange={e => setForm({ ...form, loai_uu_dai: e.target.value })}
                  className="bg-card border border-border rounded-btn px-4 py-2.5 text-body focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="giam_theo_so_luong">Giảm theo số lượng (% discount)</option>
                  <option value="mien_phi_ship">Miễn phí vận chuyển (Freeship)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-bold text-text-secondary">Áp dụng cho</label>
                <select
                  value={form.ap_dung_cho}
                  onChange={e => setForm({ ...form, ap_dung_cho: e.target.value })}
                  className="bg-card border border-border rounded-btn px-4 py-2.5 text-body focus:ring-2 focus:ring-primary outline-none"
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
                  onChange={e => {
                    const newPct = e.target.value;
                    setForm(prev => {
                      let newTen = prev.ten_km;
                      if (newTen && /Giảm\s+\d+(?:\.\d+)?%/i.test(newTen) && newPct !== '') {
                        newTen = newTen.replace(/Giảm\s+\d+(?:\.\d+)?%/i, `Giảm ${newPct}%`);
                      }
                      return { ...prev, phan_tram_giam: newPct, ten_km: newTen };
                    });
                  }}
                  placeholder="Ví dụ: 5 hoặc 10"
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

            <label className="flex items-center gap-2 text-body text-text-secondary">
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
