import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

function FloatingInput({ label, icon, ...props }) {
  const [focused, setFocused] = useState(false);
  const hasValue = props.value && props.value.length > 0;
  const isActive = focused || hasValue;

  return (
    <div className="relative">
      <span className={`absolute left-4 transition-all duration-300 ${isActive ? 'top-2 text-[10px] font-bold tracking-widest uppercase text-[#1a7a4a]' : 'top-1/2 -translate-y-1/2 text-base text-slate-400'}`}>
        {icon}
      </span>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        className={`w-full border-b-2 bg-transparent pt-5 pb-3 pl-11 pr-4 text-base text-slate-800 outline-none transition-all duration-300 placeholder:text-transparent ${focused ? 'border-[#1a7a4a]' : 'border-slate-200 hover:border-slate-300'}`}
        placeholder=" "
      />
      <label className={`absolute left-11 transition-all duration-300 pointer-events-none ${isActive ? 'top-2 text-[10px] font-bold tracking-widest uppercase text-[#1a7a4a]' : 'top-1/2 -translate-y-1/2 text-base text-slate-400'}`}>
        {label}
      </label>
      <div className={`absolute bottom-0 left-0 h-0.5 bg-[#1a7a4a] transition-all duration-500 ${focused ? 'w-full' : 'w-0'}`} />
    </div>
  );
}

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f5f0eb] flex">
      {/* Left: Hero collage */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[#0c1f13]">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1f13] via-[#145a2c] to-[#0a3518]" />

        {/* Floating product collage */}
        <div className="absolute inset-0">
          <img src="/images/raucu.webp" alt="" className="absolute top-[4%] left-[6%] w-[45%] rounded-3xl shadow-2xl rotate-[-6deg] opacity-90 border-2 border-white/10 object-cover aspect-square" />
          <img src="/images/trai_cay.webp" alt="" className="absolute top-[8%] right-[4%] w-[38%] rounded-3xl shadow-2xl rotate-[8deg] opacity-85 border-2 border-white/10 object-cover aspect-square" />
          <img src="/images/ngucoc.jpg" alt="" className="absolute bottom-[18%] left-[10%] w-[42%] rounded-3xl shadow-2xl rotate-[4deg] opacity-85 border-2 border-white/10 object-cover aspect-[4/3]" />
          <img src="/images/gia_vi.jpg" alt="" className="absolute bottom-[12%] right-[8%] w-[36%] rounded-3xl shadow-2xl rotate-[-5deg] opacity-80 border-2 border-white/10 object-cover aspect-square" />
        </div>

        {/* Blurred accents */}
        <div className="absolute top-[10%] left-[30%] w-72 h-72 rounded-full bg-[#2d9e63]/25 blur-[80px]" />
        <div className="absolute bottom-[15%] right-[20%] w-64 h-64 rounded-full bg-[#95d4b3]/15 blur-[60px]" />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

        {/* Badge only */}
        <div className="relative z-10 p-12 w-full">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-2 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#95d4b3] animate-pulse" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/80">Chợ Nông Sản Việt</span>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <AuthLayout>
      <div className="lg:hidden mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1a7a4a]/10 px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-[#1a7a4a] animate-pulse" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#1a7a4a]">Chợ Nông Sản</span>
        </div>
      </div>

      <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#1a7a4a] mb-3">Chào mừng trở lại</p>
      <h2 className="text-4xl font-black text-slate-900 tracking-tight">Đăng nhập</h2>
      <p className="mt-3 text-slate-500 text-base">Nhập thông tin để tiếp tục mua sắm nông sản sạch.</p>

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 px-5 py-4">
          <span className="material-symbols-outlined text-red-500 text-xl">error</span>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-10 space-y-7">
        <FloatingInput
          label="Email"
          icon={<span className="material-symbols-outlined text-xl">mail</span>}
          type="email"
          required
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <FloatingInput
          label="Mật khẩu"
          icon={<span className="material-symbols-outlined text-xl">lock</span>}
          type="password"
          required
          value={form.mat_khau}
          onChange={e => setForm({ ...form, mat_khau: e.target.value })}
        />

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-[#1a7a4a] py-4 text-base font-bold text-white transition-all duration-300 hover:bg-[#14633b] hover:shadow-xl hover:shadow-[#1a7a4a]/20 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              Đăng nhập
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </>
          )}
        </button>
      </form>

      <div className="mt-10 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#f5f0eb] px-4 text-xs font-bold tracking-widest uppercase text-slate-400">hoặc</span>
        </div>
      </div>

      <p className="mt-8 text-center text-slate-500">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-bold text-[#1a7a4a] hover:underline underline-offset-4">
          Đăng ký ngay
        </Link>
      </p>
    </AuthLayout>
  );
}

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', vai_tro: 'nguoi_mua' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <AuthLayout>
      <div className="lg:hidden mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1a7a4a]/10 px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-[#1a7a4a] animate-pulse" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#1a7a4a]">Chợ Nông Sản</span>
        </div>
      </div>

      <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#1a7a4a] mb-3">Tạo mới tài khoản</p>
      <h2 className="text-4xl font-black text-slate-900 tracking-tight">Đăng ký</h2>
      <p className="mt-3 text-slate-500 text-base">Bắt đầu hành trình mua sắm nông sản sạch.</p>

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 px-5 py-4">
          <span className="material-symbols-outlined text-red-500 text-xl">error</span>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <FloatingInput
          label="Họ và tên"
          icon={<span className="material-symbols-outlined text-xl">person</span>}
          required
          value={form.ho_ten}
          onChange={e => setForm({ ...form, ho_ten: e.target.value })}
        />
        <FloatingInput
          label="Email"
          icon={<span className="material-symbols-outlined text-xl">mail</span>}
          type="email"
          required
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <FloatingInput
          label="Số điện thoại"
          icon={<span className="material-symbols-outlined text-xl">call</span>}
          type="tel"
          value={form.so_dien_thoai}
          onChange={e => setForm({ ...form, so_dien_thoai: e.target.value })}
        />
        <FloatingInput
          label="Mật khẩu (tối thiểu 6 ký tự)"
          icon={<span className="material-symbols-outlined text-xl">shield</span>}
          type="password"
          minLength={6}
          required
          value={form.mat_khau}
          onChange={e => setForm({ ...form, mat_khau: e.target.value })}
        />

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-[#e85d04] py-4 text-base font-bold text-white transition-all duration-300 hover:bg-[#d45303] hover:shadow-xl hover:shadow-[#e85d04]/20 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              Tạo tài khoản
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-slate-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-bold text-[#1a7a4a] hover:underline underline-offset-4">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
