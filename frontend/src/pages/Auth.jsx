import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', mat_khau: '' });
  const [err, setErr] = useState('');
  const [load, setLoad] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setErr('');
    setLoad(true);

    try {
      const user = await login(form.email, form.mat_khau);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'farmer') navigate('/farmer/dashboard');
      else navigate('/');
    } catch (error) {
      setErr(error.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f6f2e8] to-[#edf5ef] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3 font-bold text-2xl text-emerald-800">
            <span className="text-3xl">🌿</span>
            <span>Chợ Nông Sản</span>
          </Link>
          <p className="mt-2 text-sm text-stone-500">Đăng nhập để tiếp tục mua hàng hoặc quản lý gian hàng</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-xl">
          {err && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {err}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={event => setForm({ ...form, email: event.target.value })}
                placeholder="example@email.com"
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Mật khẩu</label>
              <input
                type="password"
                required
                value={form.mat_khau}
                onChange={event => setForm({ ...form, mat_khau: event.target.value })}
                placeholder="Nhập mật khẩu"
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              disabled={load}
              className="mt-2 w-full rounded-2xl bg-emerald-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
            >
              {load ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    mat_khau: '',
    vai_tro: 'nguoi_mua',
  });
  const [err, setErr] = useState('');
  const [load, setLoad] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setErr('');
    setLoad(true);

    try {
      await authAPI.register(form);
      const user = await login(form.email, form.mat_khau);
      navigate(user.role === 'farmer' ? '/farmer/dashboard' : '/');
    } catch (error) {
      setErr(error.message || 'Đăng ký thất bại');
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f6f2e8] to-[#edf5ef] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3 font-bold text-2xl text-emerald-800">
            <span className="text-3xl">🌿</span>
            <span>Chợ Nông Sản</span>
          </Link>
          <p className="mt-2 text-sm text-stone-500">Tạo tài khoản mới để mua hàng hoặc bán nông sản</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-xl">
          {err && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {err}</div>}

          <div className="mb-5 grid grid-cols-2 gap-3">
            {[
              { v: 'nguoi_mua', icon: '🛒', l: 'Người mua', d: 'Mua nông sản sạch' },
              { v: 'nong_dan', icon: '🌾', l: 'Nông dân', d: 'Bán sản phẩm của bạn' },
            ].map(role => (
              <button
                key={role.v}
                type="button"
                onClick={() => setForm({ ...form, vai_tro: role.v })}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  form.vai_tro === role.v ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="mb-1 text-2xl">{role.icon}</div>
                <div className="text-sm font-semibold text-stone-800">{role.l}</div>
                <div className="text-xs text-stone-400">{role.d}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Họ và tên', key: 'ho_ten', type: 'text', placeholder: 'Nguyễn Văn A', required: true },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'example@email.com', required: true },
              { label: 'Số điện thoại', key: 'so_dien_thoai', type: 'tel', placeholder: '0901234567', required: false },
              { label: 'Mật khẩu', key: 'mat_khau', type: 'password', placeholder: 'Tối thiểu 6 ký tự', required: true, min: 6 },
            ].map(field => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">{field.label}</label>
                <input
                  type={field.type}
                  required={field.required}
                  minLength={field.min}
                  value={form[field.key]}
                  onChange={event => setForm({ ...form, [field.key]: event.target.value })}
                  placeholder={field.placeholder}
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={load}
              className="w-full rounded-2xl bg-emerald-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
            >
              {load ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
