import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ ho_ten: '', so_dien_thoai: '', dia_chi: '' });
  const [passwordForm, setPasswordForm] = useState({ mat_khau_cu: '', mat_khau_moi: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
    setError('');
    setMessage('');
    try {
      await authAPI.updateProfile(profileForm);
      setUser(prev => ({ ...prev, name: profileForm.ho_ten, phone: profileForm.so_dien_thoai, address: profileForm.dia_chi }));
      setMessage('Cập nhật thông tin cá nhân thành công.');
    } catch (err) {
      setError(err.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async event => {
    event.preventDefault();
    setSavingPassword(true);
    setError('');
    setMessage('');
    try {
      await authAPI.changePassword(passwordForm);
      setPasswordForm({ mat_khau_cu: '', mat_khau_moi: '' });
      setMessage('Đổi mật khẩu thành công.');
    } catch (err) {
      setError(err.message || 'Không thể đổi mật khẩu.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="market-shell pb-10">
      <div className="market-page space-y-6 py-6">
        <section className="market-panel p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2d9e63]">Hồ sơ người dùng</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Cập nhật thông tin tài khoản và bảo mật</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Các thông tin này sẽ được dùng khi đặt hàng và liên hệ trong quá trình giao hàng.
          </p>
        </section>

        {(message || error) ? (
          <div className={`market-panel px-5 py-4 text-sm ${error ? 'text-red-700' : 'text-[#1a7a4a]'}`}>
            {error || message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleProfileSave} className="market-panel p-6">
            <h2 className="text-2xl font-bold text-slate-900">Thông tin cá nhân</h2>
            <div className="mt-5 space-y-4">
              <input
                value={profileForm.ho_ten}
                onChange={event => setProfileForm({ ...profileForm, ho_ten: event.target.value })}
                placeholder="Họ và tên"
                className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
              />
              <input
                value={user?.email || ''}
                disabled
                className="w-full rounded-2xl border border-[#dce7df] bg-slate-50 px-4 py-3 text-sm text-slate-400"
              />
              <input
                value={profileForm.so_dien_thoai}
                onChange={event => setProfileForm({ ...profileForm, so_dien_thoai: event.target.value })}
                placeholder="Số điện thoại"
                className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
              />
              <textarea
                rows={4}
                value={profileForm.dia_chi}
                onChange={event => setProfileForm({ ...profileForm, dia_chi: event.target.value })}
                placeholder="Địa chỉ nhận hàng"
                className="w-full resize-none rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
              />
              <button className="rounded-full bg-[#1a7a4a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#14633b]">
                {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>

          <form onSubmit={handlePasswordSave} className="market-panel p-6">
            <h2 className="text-2xl font-bold text-slate-900">Đổi mật khẩu</h2>
            <div className="mt-5 space-y-4">
              <input
                type="password"
                value={passwordForm.mat_khau_cu}
                onChange={event => setPasswordForm({ ...passwordForm, mat_khau_cu: event.target.value })}
                placeholder="Mật khẩu hiện tại"
                className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
              />
              <input
                type="password"
                minLength={6}
                value={passwordForm.mat_khau_moi}
                onChange={event => setPasswordForm({ ...passwordForm, mat_khau_moi: event.target.value })}
                placeholder="Mật khẩu mới"
                className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
              />
              <div className="rounded-2xl bg-[#f3f7f4] px-4 py-3 text-sm text-slate-500">
                Mật khẩu mới nên có ít nhất 6 ký tự để hệ thống chấp nhận.
              </div>
              <button className="rounded-full bg-[#e85d04] px-5 py-3 text-sm font-semibold text-white hover:bg-[#cf5408]">
                {savingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
