import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ ho_ten: '', so_dien_thoai: '', dia_chi: '' });
  const [passwordForm, setPasswordForm] = useState({ mat_khau_cu: '', mat_khau_moi: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      ho_ten: user.name || '',
      so_dien_thoai: user.phone || '',
      dia_chi: user.address || '',
    });
  }, [user]);

  const handleProfileSave = async event => {
    event.preventDefault();
    setSavingProfile(true);
    setMessage('');
    setError('');

    try {
      await authAPI.updateProfile(profileForm);
      setUser(prev => ({
        ...prev,
        name: profileForm.ho_ten,
        phone: profileForm.so_dien_thoai,
        address: profileForm.dia_chi,
      }));
      setMessage('Cập nhật thông tin cá nhân thành công.');
    } catch (err) {
      setError(err.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async event => {
    event.preventDefault();
    setSavingPassword(true);
    setMessage('');
    setError('');

    try {
      await authAPI.changePassword(passwordForm);
      setPasswordForm({ mat_khau_cu: '', mat_khau_moi: '' });
      setMessage('Đổi mật khẩu thành công.');
    } catch (err) {
      setError(err.message || 'Không thể đổi mật khẩu');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Hồ sơ người dùng</h1>
            <p className="mt-2 text-sm text-stone-500">Cập nhật thông tin cá nhân, địa chỉ và bảo mật tài khoản.</p>
          </div>
          {user?.role === 'farmer' && (
            <Link to="/farmer/profile" className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
              Hồ sơ nông trại
            </Link>
          )}
        </div>

        {(message || error) && (
          <div className={`rounded-2xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {error || message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <form onSubmit={handleProfileSave} className="space-y-4 rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Thông tin cá nhân</h2>
              <p className="mt-1 text-sm text-stone-500">Các thông tin này sẽ được dùng khi đặt hàng và liên hệ.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Họ và tên</label>
              <input value={profileForm.ho_ten} onChange={event => setProfileForm({ ...profileForm, ho_ten: event.target.value })} className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
              <input value={user?.email || ''} disabled className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-400" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Số điện thoại</label>
              <input value={profileForm.so_dien_thoai} onChange={event => setProfileForm({ ...profileForm, so_dien_thoai: event.target.value })} className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Địa chỉ</label>
              <textarea value={profileForm.dia_chi} onChange={event => setProfileForm({ ...profileForm, dia_chi: event.target.value })} rows={4} className="w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
            </div>

            <button type="submit" disabled={savingProfile} className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
              {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </form>

          <form onSubmit={handlePasswordSave} className="space-y-4 rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Bảo mật tài khoản</h2>
              <p className="mt-1 text-sm text-stone-500">Đổi mật khẩu để tăng an toàn cho tài khoản của bạn.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Mật khẩu hiện tại</label>
              <input type="password" value={passwordForm.mat_khau_cu} onChange={event => setPasswordForm({ ...passwordForm, mat_khau_cu: event.target.value })} className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Mật khẩu mới</label>
              <input type="password" minLength={6} value={passwordForm.mat_khau_moi} onChange={event => setPasswordForm({ ...passwordForm, mat_khau_moi: event.target.value })} className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
            </div>

            <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-500">
              Mật khẩu mới nên có ít nhất 6 ký tự để hệ thống chấp nhận.
            </div>

            <button type="submit" disabled={savingPassword} className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60">
              {savingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
