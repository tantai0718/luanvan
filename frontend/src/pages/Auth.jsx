import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="market-shell">
      <div className="market-page grid min-h-[calc(100vh-120px)] gap-6 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="rounded-[24px] bg-[linear-gradient(135deg,#1a7a4a,#2d9e63)] p-8 text-white shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Chợ nông sản Việt</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">Giao diện tài khoản được rút gọn, rõ ràng và dễ dùng hơn.</h1>
          <p className="mt-4 text-sm leading-7 text-white/80">
            Hệ thống hiện chỉ còn hai nhóm sử dụng là người mua và quản trị viên. Tài khoản mới mặc định là người mua để tập trung vào nghiệp vụ thực tế đang có của web.
          </p>
        </aside>

        <section className="market-panel p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2d9e63]">Tài khoản</p>
          <h2 className="mt-2 text-4xl font-bold text-slate-900">{title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', mat_khau: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.mat_khau);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message || 'Email hoặc mật khẩu không đúng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Đăng nhập để tiếp tục mua hàng, theo dõi đơn hàng hoặc vào khu vực quản trị nếu bạn là admin."
    >
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          value={form.email}
          onChange={event => setForm({ ...form, email: event.target.value })}
          placeholder="Email"
          className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
        />
        <input
          type="password"
          required
          value={form.mat_khau}
          onChange={event => setForm({ ...form, mat_khau: event.target.value })}
          placeholder="Mật khẩu"
          className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
        />
        <button className="w-full rounded-full bg-[#1a7a4a] py-3 text-sm font-semibold text-white hover:bg-[#14633b]">
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-[#1a7a4a]">
          Tạo tài khoản ngay
        </Link>
      </p>
    </AuthShell>
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.register(form);
      await login(form.email, form.mat_khau);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Tài khoản đăng ký mới mặc định là người mua để dùng cho các chức năng mua hàng, đặt trước và giao định kỳ."
    >
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          value={form.ho_ten}
          onChange={event => setForm({ ...form, ho_ten: event.target.value })}
          placeholder="Họ và tên"
          className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
        />
        <input
          type="email"
          required
          value={form.email}
          onChange={event => setForm({ ...form, email: event.target.value })}
          placeholder="Email"
          className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
        />
        <input
          value={form.so_dien_thoai}
          onChange={event => setForm({ ...form, so_dien_thoai: event.target.value })}
          placeholder="Số điện thoại"
          className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
        />
        <input
          type="password"
          minLength={6}
          required
          value={form.mat_khau}
          onChange={event => setForm({ ...form, mat_khau: event.target.value })}
          placeholder="Mật khẩu"
          className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
        />
        <button className="w-full rounded-full bg-[#e85d04] py-3 text-sm font-semibold text-white hover:bg-[#cf5408]">
          {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-[#1a7a4a]">
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
