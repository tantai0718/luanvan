import { useEffect, useRef, useState } from 'react';
import { notificationAPI } from '../../services/api';
import { X, ImagePlus, Search } from 'lucide-react';
import { Badge, Btn, Loading, Modal, PageHero, Table } from '../../components/ui/AdminUI';
import ConfirmModal from '../../components/ConfirmModal';

const SERVER = 'http://localhost:5000';


const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
};

const LOAI_OPTIONS = [
  { value: 'khuyen_mai', label: 'Khuyến mãi', color: 'orange' },
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
          <label className="mb-2 block text-body text-text-secondary">Tiêu đề *</label>
          <input
            value={tieuDe}
            onChange={e => setTieuDe(e.target.value)}
            placeholder="VD: Siêu ưu đãi tháng 7"
            className="w-full rounded-btn border border-border bg-card px-4 py-3 text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
          />
        </div>

        <div>
          <label className="mb-2 block text-body text-text-secondary">Phân loại</label>
          <select
            value={loai}
            onChange={e => setLoai(e.target.value)}
            className="w-full rounded-btn border border-border bg-card px-4 py-3 text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
          >
            {LOAI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-body text-text-secondary">
            Nội dung <span className="font-normal">(tuỳ chọn)</span>
          </label>
          <textarea
            rows={3}
            value={noiDung}
            onChange={e => setNoiDung(e.target.value)}
            placeholder="Mô tả ngắn về chương trình khuyến mãi..."
            className="w-full resize-none rounded-btn border border-border bg-card px-4 py-3 text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
          />
        </div>

        <div>
          <label className="mb-2 block text-body text-text-secondary">
            Ảnh thông báo <span className="font-normal">(tuỳ chọn)</span>
          </label>
          {preview ? (
            <div className="relative overflow-hidden rounded-btn border border-border">
              <img src={preview} alt="preview" className="w-full object-cover" style={{ maxHeight: 260 }} />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-btn border-2 border-dashed border-border bg-background py-10 text-text-secondary transition-colors hover:border-primary hover:bg-primary-light/20"
            >
              <ImagePlus size={32} className="text-text-secondary/40" />
              <p className="text-body font-bold">Nhấn để chọn ảnh</p>
              <p className="text-caption">PNG, JPG, WEBP </p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        {error && (
          <div className="rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-body text-red-700">
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
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', confirmText: 'Đồng ý', type: 'danger', onConfirm: null });

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
    setConfirmModal({
      open: true,
      title: 'Xóa thông báo',
      message: 'Bạn có chắc muốn xóa thông báo này không?',
      confirmText: 'Xóa',
      type: 'danger',
      onConfirm: async () => {
        await notificationAPI.adminDelete(id);
        await loadGlobals();
      },
    });
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
              <tr key={n.matb} className="hover:bg-background">
                <td className="px-4 py-3 text-body font-semibold text-text-primary max-w-[180px] truncate">
                  {n.tieu_de}
                </td>
                <td className="px-4 py-3">
                  {img ? (
                    <img src={img} alt="thumb" className="h-14 w-20 rounded-xl object-cover border border-border" />
                  ) : (
                    <span className="text-caption text-text-secondary/50">Không có ảnh</span>
                  )}
                </td>
                <td className="px-4 py-3 text-body text-text-secondary max-w-[220px] truncate">
                  {n.noi_dung || '—'}
                </td>
                <td className="px-4 py-3">{renderLoaiBadge(n.loai)}</td>
                <td className="px-4 py-3">
                  <Badge text={n.kich_hoat ? 'Đang chạy' : 'Đã tắt'} color={n.kich_hoat ? 'green' : 'gray'} />
                </td>
               <td className="px-4 py-3 text-body text-text-secondary whitespace-nowrap">
                    {formatDateTime(n.ngay_tao)}
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
          <p className="text-h3 text-text-primary">Lịch sử thông báo tiến trình đơn hàng</p>
          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                value={histQ}
                onChange={(e) => { setHistQ(e.target.value); setHistPage(1); }}
                placeholder="Tìm theo tiêu đề, tên, email..."
                className="w-full bg-card border border-border rounded-btn pl-10 pr-4 py-2 text-body focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {historyLoading ? <Loading /> : (
          <Table
            headers={['Người nhận', 'Chi tiết thông báo', 'Loại tin', 'Trạng thái', 'Thời gian']}
            empty={{ icon: '📋', text: 'Không tìm thấy lịch sử thông báo phù hợp.' }}
          >
            {history.map((n) => (
              <tr key={n.matb} className="hover:bg-background">
                <td className="px-4 py-3">
                  <p className="text-body font-semibold text-text-primary">{n.ho_ten}</p>
                  <p className="text-caption text-text-secondary mt-0.5">{n.email}</p>
                </td>
                <td className="px-4 py-3 max-w-[320px]">
                  <p className="text-body font-bold text-text-primary truncate">{n.tieu_de}</p>
                  <p className="text-body text-text-secondary truncate mt-0.5">{n.noi_dung}</p>
                </td>
                <td className="px-4 py-3"><Badge text="Đơn hàng" color="green" /></td>
                <td className="px-4 py-3">
                  <Badge text={n.da_doc ? 'Đã đọc' : 'Chưa đọc'} color={n.da_doc ? 'gray' : 'orange'} />
                </td>
                <td className="px-4 py-3 text-body text-text-secondary whitespace-nowrap">
                    {formatDateTime(n.ngay_tao)}
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
                className={`h-8 w-8 rounded-btn text-caption font-bold transition-all ${histPage === i + 1 ? 'bg-primary text-white' : 'text-text-secondary hover:bg-background'}`}
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
