import { useEffect, useRef, useState } from 'react';
import { notificationAPI } from '../../services/api';
import { Badge, Btn, Loading, Modal, PageHero, Table } from '../../components/ui/AdminUI';

const SERVER = 'http://localhost:5000';

const LOAI_OPTIONS = [
  { value: 'khuyen_mai', label: 'Khuyến mãi', color: 'amber' },
  { value: 'he_thong', label: 'Hệ thống', color: 'gray' },
];

const renderLoaiBadge = (loaiValue) => {
  const option = LOAI_OPTIONS.find(o => o.value === loaiValue) || LOAI_OPTIONS[0];
  return <Badge text={option.label} color={option.color} />;
};

function resolveImage(hinh_anh) {
  if (!hinh_anh) return null;
  if (hinh_anh.startsWith('http') || hinh_anh.startsWith('data:')) return hinh_anh;
  return `${SERVER}${hinh_anh.startsWith('/') ? '' : '/upload/'}${hinh_anh}`;
}

// ── Modal thêm/sửa thông báo — chỉ còn Phân loại + Ảnh ──────────────
function NotifFormModal({ initial, onSave, onClose, saving }) {
  const [tieuDe, setTieuDe] = useState(initial?.tieu_de || '');
  const [noiDung, setNoiDung] = useState(initial?.noi_dung || '');
  const [loai, setLoai] = useState(initial?.loai || 'khuyen_mai');
  const [preview, setPreview] = useState(resolveImage(initial?.hinh_anh) || null);
  const [hinhAnh, setHinhAnh] = useState(initial?.hinh_anh || null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPreview(ev.target.result);
      setHinhAnh(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setPreview(null);
    setHinhAnh(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!tieuDe.trim()) { setError('Vui lòng nhập tiêu đề thông báo.'); return; }
    setError('');
    onSave({ tieu_de: tieuDe.trim(), noi_dung: noiDung.trim(), loai, hinh_anh: hinhAnh });
  };

  return (
    <Modal title={initial ? 'Chỉnh sửa thông báo' : 'Thêm thông báo mới'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-body-md font-body-md text-on-surface-variant">Tiêu đề *</label>
          <input
            value={tieuDe}
            onChange={e => setTieuDe(e.target.value)}
            placeholder="VD: Siêu ưu đãi tháng 7"
            className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed"
          />
        </div>

        <div>
          <label className="mb-2 block text-body-md font-body-md text-on-surface-variant">Phân loại</label>
          <select
            value={loai}
            onChange={e => setLoai(e.target.value)}
            className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed"
          >
            {LOAI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-body-md font-body-md text-on-surface-variant">
            Nội dung <span className="font-normal">(tuỳ chọn)</span>
          </label>
          <textarea
            rows={3}
            value={noiDung}
            onChange={e => setNoiDung(e.target.value)}
            placeholder="Mô tả ngắn về chương trình khuyến mãi..."
            className="w-full resize-none rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed"
          />
        </div>

        <div>
          <label className="mb-2 block text-body-md font-body-md text-on-surface-variant">
            Ảnh thông báo <span className="font-normal">(tuỳ chọn)</span>
          </label>
          {preview ? (
            <div className="relative overflow-hidden rounded-2xl border border-outline-variant">
              <img src={preview} alt="preview" className="w-full object-cover" style={{ maxHeight: 260 }} />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low py-10 text-on-surface-variant transition-colors hover:border-primary hover:bg-primary-fixed/20"
            >
              <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
              <p className="text-body-md font-bold">Nhấn để chọn ảnh</p>
              <p className="text-label-sm">PNG, JPG, WEBP — tối đa 5MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        {error && (
          <div className="rounded-2xl border border-error-container bg-error-container/20 px-4 py-3 text-body-md text-on-error-container">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Btn className="flex-1 justify-center" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thông báo'}
          </Btn>
          <Btn variant="outline" className="flex-1 justify-center" onClick={onClose}>Đóng</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════
export default function AdminNotifications() {
  const [globals, setGlobals] = useState([]);
  const [history, setHistory] = useState([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histQ, setHistQ] = useState('');
  const [histPage, setHistPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const histLimit = 15;

  const loadGlobals = () => {
    setLoading(true);
    return notificationAPI.adminGetAllGlobal()
      .then(d => setGlobals(d.notifications || []))
      .catch(() => setGlobals([]))
      .finally(() => setLoading(false));
  };

  const loadHistory = () => {
    setHistoryLoading(true);
    return notificationAPI.adminGetOrderHistory(histQ, histPage)
      .then(d => { setHistory(d.notifications || []); setHistTotal(d.total || 0); })
      .catch(() => { setHistory([]); setHistTotal(0); })
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => { loadGlobals(); }, []);
  useEffect(() => { loadHistory(); }, [histQ, histPage]);

  const totalPages = Math.max(1, Math.ceil(histTotal / histLimit));

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) await notificationAPI.adminUpdate(editing.matb, form);
      else await notificationAPI.adminCreate(form);
      setModalOpen(false);
      setEditing(null);
      await loadGlobals();
    } finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    await notificationAPI.adminToggle(id);
    await loadGlobals();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa thông báo này?')) return;
    await notificationAPI.adminDelete(id);
    await loadGlobals();
  };

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (n) => { setEditing(n); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Thông báo"
        title="Quản lý thông báo hệ thống"
        body="Đăng ảnh khuyến mãi hoặc thông báo hệ thống — hiển thị dạng popup cho khách khi vào trang."
        actions={<Btn onClick={openAdd}>+ Thêm thông báo</Btn>}
      />

      {loading ? <Loading /> : (
        <Table
          headers={['Tiêu đề', 'Ảnh', 'Nội dung', 'Phân loại', 'Trạng thái', 'Ngày tạo', 'Hành động']}
          empty={{ icon: '📢', text: 'Chưa có thông báo toàn trang nào được phát hành.' }}
        >
          {globals.map((n) => {
            const img = resolveImage(n.hinh_anh);
            return (
              <tr key={n.matb} className="hover:bg-surface-container-low">
                <td className="px-4 py-3 text-title-md font-title-md text-on-surface max-w-[180px] truncate">
                  {n.tieu_de}
                </td>
                <td className="px-4 py-3">
                  {img ? (
                    <img src={img} alt="thumb" className="h-14 w-20 rounded-xl object-cover border border-outline-variant" />
                  ) : (
                    <span className="text-label-sm text-on-surface-variant/50">Không có ảnh</span>
                  )}
                </td>
                <td className="px-4 py-3 text-body-md text-on-surface-variant max-w-[220px] truncate">
                  {n.noi_dung || '—'}
                </td>
                <td className="px-4 py-3">{renderLoaiBadge(n.loai)}</td>
                <td className="px-4 py-3">
                  <Badge text={n.kich_hoat ? 'Đang chạy' : 'Đã tắt'} color={n.kich_hoat ? 'green' : 'gray'} />
                </td>
                <td className="px-4 py-3 text-body-md text-on-surface-variant whitespace-nowrap">
                  {new Date(n.ngay_tao).toLocaleString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Btn size="sm" variant={n.kich_hoat ? 'ghost' : 'primary'} onClick={() => handleToggle(n.matb)}>
                      {n.kich_hoat ? 'Tắt' : 'Bật'}
                    </Btn>
                    <Btn size="sm" variant="outline" onClick={() => openEdit(n)}>Sửa</Btn>
                    <Btn size="sm" variant="danger" onClick={() => handleDelete(n.matb)}>Xóa</Btn>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* ── LỊCH SỬ THÔNG BÁO ĐƠN HÀNG ── */}
      <div className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
          <p className="text-title-md font-title-md text-on-surface">Lịch sử thông báo tiến trình đơn hàng</p>
          <div className="w-full sm:w-72">
            <input
              value={histQ}
              onChange={(e) => { setHistQ(e.target.value); setHistPage(1); }}
              placeholder="Tìm theo tiêu đề, tên, email..."
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 text-body-md focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {historyLoading ? <Loading /> : (
          <Table
            headers={['Người nhận', 'Chi tiết thông báo', 'Loại tin', 'Trạng thái', 'Thời gian']}
            empty={{ icon: '📋', text: 'Không tìm thấy lịch sử thông báo phù hợp.' }}
          >
            {history.map((n) => (
              <tr key={n.matb} className="hover:bg-surface-container-low">
                <td className="px-4 py-3">
                  <p className="text-title-md font-title-md text-on-surface">{n.ho_ten}</p>
                  <p className="text-label-sm text-on-surface-variant mt-0.5">{n.email}</p>
                </td>
                <td className="px-4 py-3 max-w-[320px]">
                  <p className="text-body-md font-bold text-on-surface truncate">{n.tieu_de}</p>
                  <p className="text-body-md text-on-surface-variant truncate mt-0.5">{n.noi_dung}</p>
                </td>
                <td className="px-4 py-3"><Badge text="Đơn hàng" color="green" /></td>
                <td className="px-4 py-3">
                  <Badge text={n.da_doc ? 'Đã đọc' : 'Chưa đọc'} color={n.da_doc ? 'gray' : 'amber'} />
                </td>
                <td className="px-4 py-3 text-body-md text-on-surface-variant whitespace-nowrap">
                  {new Date(n.ngay_tao).toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
          </Table>
        )}

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setHistPage(i + 1)}
                className={`h-8 w-8 rounded-lg text-label-sm font-bold transition-all ${histPage === i + 1 ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <NotifFormModal
          initial={editing}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
        />
      )}
    </div>
  );
}