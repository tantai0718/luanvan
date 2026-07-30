import { useEffect, useState } from 'react';
import { bannerAPI } from '../../services/api';
import { Upload, ArrowLeft, ArrowRight, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { Badge, Btn, Loading, PageHero, StatCard } from '../../components/ui/AdminUI';

const readFileAsDataUrl = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}`));
    reader.readAsDataURL(file);
  });

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function UploadButton({ multiple = false, label, disabled, onFiles }) {
  return (
    <label className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-body font-semibold text-white hover:bg-primary/80 transition-all ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <Upload size={16} />
      {label}
      <input type="file" accept="image/*" multiple={multiple} disabled={disabled} className="hidden" onChange={e => { onFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
    </label>
  );
}

function BannerCard({ banner, busy, isFirst, isLast, onReplace, onToggle, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div className="bg-card rounded-card border border-border shadow-card overflow-hidden">
      <div className="relative">
        <img
        src={banner.image.startsWith('http') ? banner.image : `http://localhost:5000/upload/${banner.image}`}
        alt={`Banner ${banner.order}`}
        className="aspect-[16/7] w-full object-cover"
      />
        <div className="absolute left-4 top-4"><Badge text={banner.active ? 'Đang chạy' : 'Đã tắt'} color={banner.active ? 'green' : 'gray'} /></div>
      </div>
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-body font-bold text-text-primary">Banner #{banner.order}</p>
          <p className="text-caption text-text-secondary">Ngày tạo: {formatDate(banner.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isFirst && <Btn size="sm" variant="ghost" disabled={busy} onClick={() => onMoveUp(banner)}><ArrowLeft size={16} /></Btn>}
          {!isLast && <Btn size="sm" variant="ghost" disabled={busy} onClick={() => onMoveDown(banner)}><ArrowRight size={16} /></Btn>}
          <label className={`inline-flex cursor-pointer items-center justify-center rounded-btn border border-border bg-card px-3 py-2 text-caption font-semibold text-text-primary hover:bg-background transition-all ${busy ? 'pointer-events-none opacity-60' : ''}`}>
            Đổi ảnh
            <input type="file" accept="image/*" disabled={busy} className="hidden" onChange={e => { onReplace(banner, e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <Btn size="sm" variant={banner.active ? 'ghost' : 'primary'} disabled={busy} onClick={() => onToggle(banner.id)}>{banner.active ? 'Tắt' : 'Bật'}</Btn>
          <Btn size="sm" variant="danger" disabled={busy} onClick={() => onDelete(banner.id)}>Xóa</Btn>
        </div>
      </div>
    </div>
  );
}

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchBanners = async () => {
    setLoading(true);
    try { const data = await bannerAPI.adminAll(); setBanners(data.banners || []); }
    catch (err) { setBanners([]); setError(err.message || 'Không tải được danh sách banner.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBanners(); }, []);

  const addBanners = async files => {
    if (!files.length) return;
    setSaving(true); setError('');
    try {
      const startOrder = Math.max(0, ...banners.map(item => Number(item.order) || 0)) + 1;
      const images = await Promise.all(files.map(readFileAsDataUrl));
      for (const [index, image] of images.entries()) {
        await bannerAPI.create({ image, order: startOrder + index, active: true });
      }
      await fetchBanners();
    } catch (err) { setError(err.message || 'Không thêm được banner.'); }
    finally { setSaving(false); }
  };

  const replaceBanner = async (banner, file) => {
    if (!file) return;
    setSaving(true); setError('');
    try {
      const image = await readFileAsDataUrl(file);
      await bannerAPI.update(banner.id, { image, order: banner.order, active: banner.active });
      await fetchBanners();
    } catch (err) { setError(err.message || 'Không đổi được ảnh banner.'); }
    finally { setSaving(false); }
  };

  const swapOrder = async (banner1, banner2) => {
    setSaving(true); setError('');
    try {
      await Promise.all([
        bannerAPI.update(banner1.id, { image: banner1.image, order: banner2.order, active: banner1.active }),
        bannerAPI.update(banner2.id, { image: banner2.image, order: banner1.order, active: banner2.active }),
      ]);
      await fetchBanners();
    } catch (err) { setError(err.message || 'Không đổi được vị trí.'); }
    finally { setSaving(false); }
  };

  const moveUp = banner => { const i = banners.findIndex(b => b.id === banner.id); if (i > 0) swapOrder(banner, banners[i - 1]); };
  const moveDown = banner => { const i = banners.findIndex(b => b.id === banner.id); if (i < banners.length - 1) swapOrder(banner, banners[i + 1]); };

  const toggleBanner = async id => {
    setSaving(true); setError('');
    try { await bannerAPI.toggle(id); setBanners(prev => prev.map(item => (item.id === id ? { ...item, active: !item.active } : item))); }
    catch (err) { setError(err.message || 'Không cập nhật được banner.'); }
    finally { setSaving(false); }
  };

  const deleteBanner = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa banner này không?')) return;
    setSaving(true); setError('');
    try { await bannerAPI.delete(id); setBanners(prev => prev.filter(item => item.id !== id)); }
    catch (err) { setError(err.message || 'Không xóa được banner.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Banner" title="Quản lý ảnh banner trang chủ" body="Chọn nhiều ảnh để thêm banner một lần. Ảnh nào không muốn chạy nữa thì tắt, ảnh nào muốn đổi thì thay trực tiếp trên ảnh đó."
        actions={<UploadButton multiple label={saving ? 'Đang lưu...' : '+ Chọn nhiều ảnh'} disabled={saving} onFiles={addBanners} />} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<ImageIcon size={20} />} label="Tổng banner" value={banners.length} color="green" />
        <StatCard icon={<Eye size={20} />} label="Đang chạy" value={banners.filter(item => item.active).length} color="blue" />
        <StatCard icon={<EyeOff size={20} />} label="Đã tắt" value={banners.filter(item => !item.active).length} color="gray" />
      </div>

      {error && <div className="rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-body text-red-700">{error}</div>}

      {loading ? <Loading /> : banners.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {banners.map((banner, index) => (
            <BannerCard key={banner.id} banner={banner} busy={saving} isFirst={index === 0} isLast={index === banners.length - 1}
              onReplace={replaceBanner} onToggle={toggleBanner} onDelete={deleteBanner} onMoveUp={moveUp} onMoveDown={moveDown} />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-card py-16 text-center border border-dashed border-border">
          <ImageIcon size={48} className="mx-auto text-text-secondary/30" />
          <p className="mt-3 text-body text-text-secondary">Chưa có banner nào.</p>
          <div className="mt-5"><UploadButton multiple label="+ Chọn nhiều ảnh" disabled={saving} onFiles={addBanners} /></div>
        </div>
      )}
    </div>
  );
}
