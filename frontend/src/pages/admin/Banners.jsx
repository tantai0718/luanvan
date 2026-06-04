import { useEffect, useState } from 'react';
import { bannerAPI } from '../../services/api';
import { Badge, Btn, Input, Loading, Modal, PageHero, StatCard } from '../../components/ui/AdminUI';

const emptyForm = {
  title: '',
  description: '',
  image: '',
  order: 1,
  active: true,
};

const readFileAsDataUrl = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}`));
    reader.readAsDataURL(file);
  });

function BannerFormModal({ initialData, onClose, onDone }) {
  const [form, setForm] = useState({
    ...emptyForm,
    ...initialData,
    active: initialData?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const image = await readFileAsDataUrl(file);
      setForm(prev => ({ ...prev, image }));
    } catch (err) {
      setError(err.message || 'Không tải được ảnh banner.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSave = async event => {
    event.preventDefault();
    if (!form.image) {
      setError('Vui lòng chọn ảnh banner.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        order: Number(form.order) || 1,
      };
      if (initialData?.id) {
        await bannerAPI.update(initialData.id, payload);
      } else {
        await bannerAPI.create(payload);
      }
      onDone();
    } catch (err) {
      setError(err.message || 'Không lưu được banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={initialData?.id ? 'Cập nhật banner' : 'Thêm banner'} onClose={onClose} size="lg">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Tiêu đề" value={form.title || ''} onChange={event => setForm({ ...form, title: event.target.value })} />
          <Input label="Thứ tự hiển thị" type="number" min="1" value={form.order} onChange={event => setForm({ ...form, order: event.target.value })} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Mô tả</label>
          <textarea
            rows={3}
            value={form.description || ''}
            onChange={event => setForm({ ...form, description: event.target.value })}
            className="w-full resize-none rounded-2xl border border-[#dce7df] px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#2d9e63] focus:ring-2 focus:ring-[#e8f5ee]"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-slate-700">Ảnh banner</label>
            <label className="cursor-pointer rounded-full bg-[#e8f5ee] px-4 py-2 text-sm font-semibold text-[#1a7a4a] hover:bg-[#dff0e7]">
              {uploading ? 'Đang tải...' : 'Chọn ảnh từ máy'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>

          {form.image ? (
            <img src={form.image} alt="Xem trước banner" className="aspect-[16/7] w-full rounded-2xl border border-[#dce7df] object-cover" />
          ) : (
            <div className="flex aspect-[16/7] items-center justify-center rounded-2xl border border-dashed border-[#dce7df] text-sm text-slate-400">
              Chưa có ảnh banner.
            </div>
          )}
        </div>

        <label className="flex items-center gap-3 rounded-2xl bg-[#f3f7f4] px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(form.active)}
            onChange={event => setForm({ ...form, active: event.target.checked })}
            className="h-4 w-4 accent-[#1a7a4a]"
          />
          Hiển thị banner trên trang chủ
        </label>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="flex gap-3">
          <Btn className="flex-1 justify-center" disabled={saving || uploading}>
            {saving ? 'Đang lưu...' : 'Lưu banner'}
          </Btn>
          <Btn type="button" variant="outline" className="flex-1 justify-center" onClick={onClose}>
            Đóng
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function BannerCard({ banner, onEdit, onToggle, onDelete }) {
  return (
    <div className="market-panel overflow-hidden">
      <div className="relative">
        <img src={banner.image} alt={banner.title || 'Banner'} className="aspect-[16/7] w-full object-cover" />
        <div className="absolute left-4 top-4">
          <Badge text={banner.active ? 'Đang hiển thị' : 'Đã ẩn'} color={banner.active ? 'green' : 'gray'} />
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Thứ tự {banner.order}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{banner.title || 'Banner không tiêu đề'}</h3>
          </div>
        </div>
        {banner.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{banner.description}</p> : null}
        <div className="mt-4 flex gap-2">
          <Btn size="sm" variant="outline" className="flex-1 justify-center" onClick={() => onEdit(banner)}>Sửa</Btn>
          <Btn size="sm" variant={banner.active ? 'ghost' : 'primary'} className="flex-1 justify-center" onClick={() => onToggle(banner.id)}>
            {banner.active ? 'Ẩn' : 'Hiện'}
          </Btn>
          <Btn size="sm" variant="danger" onClick={() => onDelete(banner.id)}>Xóa</Btn>
        </div>
      </div>
    </div>
  );
}

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await bannerAPI.adminAll();
      setBanners(data.banners || []);
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const toggleBanner = async id => {
    await bannerAPI.toggle(id);
    setBanners(prev => prev.map(item => (item.id === id ? { ...item, active: !item.active } : item)));
  };

  const deleteBanner = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa banner này không?')) return;
    await bannerAPI.delete(id);
    setBanners(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Banner"
        title="Quản lý ảnh banner trang chủ"
        body="Admin có thể thêm, thay ảnh, sắp xếp thứ tự và bật tắt các banner đang chạy ở đầu trang chủ."
        actions={<Btn onClick={() => setEditingBanner({})}>+ Thêm banner</Btn>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<span className="material-symbols-outlined">image</span>} label="Tổng banner" value={banners.length} color="green" />
        <StatCard icon={<span className="material-symbols-outlined">visibility</span>} label="Đang hiển thị" value={banners.filter(item => item.active).length} color="blue" />
        <StatCard icon={<span className="material-symbols-outlined">hide_image</span>} label="Đã ẩn" value={banners.filter(item => !item.active).length} color="gray" />
      </div>

      {loading ? (
        <Loading />
      ) : banners.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {banners.map(banner => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={setEditingBanner}
              onToggle={toggleBanner}
              onDelete={deleteBanner}
            />
          ))}
        </div>
      ) : (
        <div className="market-panel py-16 text-center text-slate-400">
          <span className="material-symbols-outlined mb-3 text-4xl">image</span>
          <p>Chưa có banner nào.</p>
        </div>
      )}

      {editingBanner !== null ? (
        <BannerFormModal
          initialData={editingBanner.id ? editingBanner : null}
          onClose={() => setEditingBanner(null)}
          onDone={() => {
            setEditingBanner(null);
            fetchBanners();
          }}
        />
      ) : null}
    </div>
  );
}
