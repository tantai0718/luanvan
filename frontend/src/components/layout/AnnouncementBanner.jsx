import { useEffect, useState } from 'react';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DISMISSED_KEY = 'dismissed_global_notifications';
const LAST_USER_KEY  = 'global_notif_last_user';
const SERVER = 'http://localhost:5000';

function getDismissedIds() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); }
  catch { return []; }
}
function addDismissedId(id) {
  const current = getDismissedIds();
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...new Set([...current, id])]));
}

function resolveImage(hinh_anh) {
  if (!hinh_anh) return null;
  if (hinh_anh.startsWith('http') || hinh_anh.startsWith('data:')) return hinh_anh;
  return `${SERVER}${hinh_anh.startsWith('/') ? '' : '/upload/'}${hinh_anh}`;
}

// Cấu trúc mới gọn gàng theo ý bạn
const LOAI_LABEL = {
  khuyen_mai: { label: 'Khuyến mãi' },
  he_thong:   { label: 'Hệ thống' },
  don_hang:   { label: 'Đơn hàng' },
};

export default function AnnouncementBanner() {
  const { user, loading } = useAuth();
  const [queue, setQueue] = useState([]);
  const [open, setOpen]   = useState(false);

  const fetchAndShow = () => {
    notificationAPI.getGlobal()
      .then(data => {
        const dismissed = new Set(getDismissedIds());
        const visible   = (data.notifications || []).filter(n => !dismissed.has(n.matb));
        setQueue(visible);
        setOpen(visible.length > 0);
      })
      .catch(() => setOpen(false));
  };

  useEffect(() => {
    if (loading) return;

    const currentUserKey = user?.id != null ? String(user.id) : 'guest';
    const lastUserKey = localStorage.getItem(LAST_USER_KEY);

    if (lastUserKey !== currentUserKey) {
      localStorage.removeItem(DISMISSED_KEY);
      localStorage.setItem(LAST_USER_KEY, currentUserKey);
    }

    fetchAndShow();
  }, [user, loading]);

  if (!open || !queue.length) return null;

  const current = queue[0];
  const meta    = LOAI_LABEL[current.loai] || LOAI_LABEL.he_thong;
  const imgSrc  = resolveImage(current.hinh_anh);
  const hasImg  = Boolean(imgSrc);

  const handleDismiss = () => {
    addDismissedId(current.matb);
    const rest = queue.slice(1);
    setQueue(rest);
    if (!rest.length) setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleDismiss}
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxWidth: hasImg ? 460 : 400 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white transition-all hover:bg-black/40"
          aria-label="Đóng">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>

        {hasImg ? (
          <>
            {/* Ảnh hiển thị trọn vẹn, không còn lớp gradient/chữ đè lên trên */}
            <img
              src={imgSrc}
              alt={current.tieu_de}
              className="w-full object-cover"
              style={{ maxHeight: 320 }}
            />

            {/* Tiêu đề chuyển xuống khối trắng bên dưới ảnh, không còn che chữ trong ảnh nữa */}
            <div className="px-5 pt-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                {meta.label}
              </div>
              {current.tieu_de && (
                <h3 className="text-xl font-bold text-on-surface leading-tight">{current.tieu_de}</h3>
              )}
            </div>

            {current.noi_dung && (
              <div className="px-5 pt-2 pb-4">
                <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{current.noi_dung}</p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-outline-variant/40 px-5 py-3">
              {queue.length > 1 && (
                <p className="text-xs text-on-surface-variant">Còn {queue.length - 1} thông báo khác</p>
              )}
              <button
                onClick={handleDismiss}
                className="ml-auto rounded-full bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 active:scale-95 transition-all">
                Đã hiểu & Đóng
              </button>
            </div>
          </>
        ) : (
          <div className="p-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              {meta.label}
            </div>
            <h3 className="text-lg font-bold text-on-surface">{current.tieu_de}</h3>
            {current.noi_dung && (
              <p className="mt-2 text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{current.noi_dung}</p>
            )}
            <div className="mt-5 flex items-center justify-between">
              {queue.length > 1 && (
                <p className="text-xs text-on-surface-variant">Còn {queue.length - 1} thông báo khác</p>
              )}
              <button
                onClick={handleDismiss}
                className="ml-auto rounded-full bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 active:scale-95 transition-all">
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}