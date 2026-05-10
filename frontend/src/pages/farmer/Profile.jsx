import { useEffect, useState } from 'react';
import { farmerAPI } from '../../services/api';

export default function FarmerProfile() {
  const [form, setForm] = useState({
    ten_nong_trai: '',
    tinh_thanh: '',
    quan_huyen: '',
    gioi_thieu: '',
  });
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    farmerAPI
      .getProfile()
      .then(data => {
        const profile = data.profile;
        setForm({
          ten_nong_trai: profile.ten_nong_trai || '',
          tinh_thanh: profile.tinh_thanh || '',
          quan_huyen: profile.quan_huyen || '',
          gioi_thieu: profile.gioi_thieu || '',
        });
        setVerified(Boolean(profile.da_xac_minh));
      })
      .catch(err => setError(err.message || 'Không tải được hồ sơ nông trại'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await farmerAPI.updateProfile(form);
      setMessage('Cập nhật hồ sơ nông trại thành công.');
    } catch (err) {
      setError(err.message || 'Không thể cập nhật hồ sơ nông trại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Hồ sơ nông trại</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {verified ? 'Đã xác minh' : 'Chờ xác minh'}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Cập nhật thông tin nông trại để người mua hiểu rõ hơn về gian hàng của bạn.</p>
        </div>

        {(message || error) && (
          <div className={`rounded-2xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {error || message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tên nông trại</label>
              <input value={form.ten_nong_trai} onChange={event => setForm({ ...form, ten_nong_trai: event.target.value })} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tỉnh / thành phố</label>
              <input value={form.tinh_thanh} onChange={event => setForm({ ...form, tinh_thanh: event.target.value })} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Quận / huyện</label>
            <input value={form.quan_huyen} onChange={event => setForm({ ...form, quan_huyen: event.target.value })} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Giới thiệu nông trại</label>
            <textarea value={form.gioi_thieu} onChange={event => setForm({ ...form, gioi_thieu: event.target.value })} rows={6} className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100" />
          </div>

          <button type="submit" disabled={saving} className="rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Lưu hồ sơ nông trại'}
          </button>
        </form>
      </div>
    </div>
  );
}
