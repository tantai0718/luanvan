import { useEffect, useState } from 'react';
import { bannerAPI } from '../../services/api';
import { Badge, Btn, Loading, PageHero, StatCard } from '../../components/ui/AdminUI';

const readFileAsDataUrl = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}`));
    reader.readAsDataURL(file);
  });

function UploadButton({ multiple = false, label, disabled, onFiles }) {
  return (
    <label className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#1a7a4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#14633b] ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <span className="material-symbols-outlined text-[19px]">upload</span>
      {label}
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={event => {
          onFiles(Array.from(event.target.files || []));
          event.target.value = '';
        }}
      />
    </label>
  );
}

function BannerCard({ banner, busy, onReplace, onToggle, onDelete }) {
  return (
    <div className="market-panel overflow-hidden">
      <div className="relative">
        <img src={banner.image} alt={`Banner ${banner.order}`} className="aspect-[16/7] w-full object-cover" />
        <div className="absolute left-4 top-4">
          <Badge text={banner.active ? 'Đang chạy' : 'Đã tắt'} color={banner.active ? 'green' : 'gray'} />
        </div>
      </div>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-900">Banner #{banner.order}</p>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex cursor-pointer items-center justify-center rounded-2xl border border-[#dce7df] bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[#f3f7f4] ${busy ? 'pointer-events-none opacity-60' : ''}`}>
            Đổi ảnh
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              className="hidden"
              onChange={event => {
                onReplace(banner, event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </label>
          <Btn size="sm" variant={banner.active ? 'ghost' : 'primary'} disabled={busy} onClick={() => onToggle(banner.id)}>
            {banner.active ? 'Tắt' : 'Bật'}
          </Btn>
          <Btn size="sm" variant="danger" disabled={busy} onClick={() => onDelete(banner.id)}>
            Xóa
          </Btn>
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
    try {
      const data = await bannerAPI.adminAll();
      setBanners(data.banners || []);
    } catch (err) {
      setBanners([]);
      setError(err.message || 'Không tải được danh sách banner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const addBanners = async files => {
    if (!files.length) return;
    setSaving(true);
    setError('');
    try {
      const startOrder = Math.max(0, ...banners.map(item => Number(item.order) || 0)) + 1;
      const images = await Promise.all(files.map(readFileAsDataUrl));
      for (const [index, image] of images.entries()) {
        await bannerAPI.create({
          image,
          order: startOrder + index,
          active: true,
        });
      }
      await fetchBanners();
    } catch (err) {
      setError(err.message || 'Không thêm được banner.');
    } finally {
      setSaving(false);
    }
  };

  const replaceBanner = async (banner, file) => {
    if (!file) return;
    setSaving(true);
    setError('');
    try {
      const image = await readFileAsDataUrl(file);
      await bannerAPI.update(banner.id, {
        image,
        order: banner.order,
        active: banner.active,
      });
      await fetchBanners();
    } catch (err) {
      setError(err.message || 'Không đổi được ảnh banner.');
    } finally {
      setSaving(false);
    }
  };

  const toggleBanner = async id => {
    setSaving(true);
    setError('');
    try {
      await bannerAPI.toggle(id);
      setBanners(prev => prev.map(item => (item.id === id ? { ...item, active: !item.active } : item)));
    } catch (err) {
      setError(err.message || 'Không cập nhật được banner.');
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa banner này không?')) return;
    setSaving(true);
    setError('');
    try {
      await bannerAPI.delete(id);
      setBanners(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err.message || 'Không xóa được banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Banner"
        title="Quản lý ảnh banner trang chủ"
        body="Chọn nhiều ảnh để thêm banner một lần. Ảnh nào không muốn chạy nữa thì tắt, ảnh nào muốn đổi thì thay trực tiếp trên ảnh đó."
        actions={<UploadButton multiple label={saving ? 'Đang lưu...' : '+ Chọn nhiều ảnh'} disabled={saving} onFiles={addBanners} />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<span className="material-symbols-outlined">image</span>} label="Tổng banner" value={banners.length} color="green" />
        <StatCard icon={<span className="material-symbols-outlined">visibility</span>} label="Đang chạy" value={banners.filter(item => item.active).length} color="blue" />
        <StatCard icon={<span className="material-symbols-outlined">hide_image</span>} label="Đã tắt" value={banners.filter(item => !item.active).length} color="gray" />
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <Loading />
      ) : banners.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {banners.map(banner => (
            <BannerCard
              key={banner.id}
              banner={banner}
              busy={saving}
              onReplace={replaceBanner}
              onToggle={toggleBanner}
              onDelete={deleteBanner}
            />
          ))}
        </div>
      ) : (
        <div className="market-panel py-16 text-center text-slate-400">
          <span className="material-symbols-outlined mb-3 text-4xl">image</span>
          <p>Chưa có banner nào.</p>
          <div className="mt-5">
            <UploadButton multiple label="+ Chọn nhiều ảnh" disabled={saving} onFiles={addBanners} />
          </div>
        </div>
      )}
    </div>
  );
}
