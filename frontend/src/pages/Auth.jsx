import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

function FloatingInput({ label, icon, ...props }) {
  const [focused, setFocused] = useState(false);
  const hasValue = props.value && props.value.length > 0;
  const isActive = focused || hasValue;

  return (
    <div className="relative pt-3">
      {/* Icon cố định ở lề trái */}
      <span className="absolute left-1 bottom-3 text-slate-500 flex items-center justify-center">
        {icon}
      </span>

      {/* Input với padding-left rộng hơn để không dính Icon */}
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        className={`w-full border-b bg-transparent pb-2.5 pl-10 pr-3 text-base font-medium text-slate-800 outline-none transition-all duration-300 placeholder:text-transparent ${
          focused ? 'border-[#1a7a4a]' : 'border-slate-300 hover:border-slate-400'
        }`}
        placeholder=" "
      />

      {/* Label: Đổi vị trí khi active để đẩy hẳn lên trên, KHÔNG BỊ ĐÈ lên Icon */}
      <label
        className={`absolute transition-all duration-200 pointer-events-none ${
          isActive
            ? '-top-1 left-10 text-[11px] font-bold tracking-wider uppercase text-[#1a7a4a]'
            : 'top-6 left-10 text-base text-slate-400'
        }`}
      >
        {label}
      </label>

      {/* Thanh underline khi focus */}
      <div
        className={`absolute bottom-0 left-0 h-[2px] bg-[#1a7a4a] transition-all duration-300 ${
          focused ? 'w-full' : 'w-0'
        }`}
      />
    </div>
  );
}

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center p-4 md:p-8">
      {/* Thẻ Card chính */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex min-h-[600px] border border-slate-100">
        
        {/* Left: Hero collage */}
        <div className="hidden md:flex md:w-[48%] relative overflow-hidden bg-[#0c1f13] p-8 flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c1f13] via-[#145a2c] to-[#0a3518]" />

          {/* Product collage */}
          <div className="absolute inset-0 p-6">
            <img src="/images/raucu.webp" alt="" className="absolute top-[8%] left-[8%] w-[40%] rounded-2xl shadow-xl rotate-[-4deg] opacity-90 border border-white/20 object-cover aspect-square" />
            <img src="/images/trai_cay.webp" alt="" className="absolute top-[12%] right-[8%] w-[36%] rounded-2xl shadow-xl rotate-[6deg] opacity-85 border border-white/20 object-cover aspect-square" />
            <img src="/images/ngucoc.jpg" alt="" className="absolute bottom-[12%] left-[10%] w-[38%] rounded-2xl shadow-xl rotate-[3deg] opacity-85 border border-white/20 object-cover aspect-[4/3]" />
            <img src="/images/gia_vi.jpg" alt="" className="absolute bottom-[10%] right-[10%] w-[34%] rounded-2xl shadow-xl rotate-[-4deg] opacity-80 border border-white/20 object-cover aspect-square" />
          </div>

          <div className="absolute top-[20%] left-[20%] w-48 h-48 rounded-full bg-[#2d9e63]/20 blur-[60px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-[#95d4b3] animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-white/90">Chợ Nông Sản Việt</span>
            </div>
          </div>

          <p className="relative z-10 text-sm text-white/80">
            Nông sản sạch từ nông trại đến gian bếp nhà bạn.
          </p>
        </div>

        {/* Right: Form - Tăng kích thước font & padding */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-md">
            {children}
          </div>
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
      <div className="md:hidden mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1a7a4a]/10 px-3.5 py-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1a7a4a] animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase text-[#1a7a4a]">Chợ Nông Sản</span>
        </div>
      </div>

      <p className="text-xs font-bold tracking-widest uppercase text-[#1a7a4a] mb-1.5">Chào mừng trở lại</p>
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Đăng nhập</h2>
      <p className="mt-1.5 text-slate-500 text-base">Nhập thông tin để tiếp tục mua sắm nông sản sạch.</p>

      {error && (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <span className="material-symbols-outlined text-red-500 text-xl">error</span>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <FloatingInput
          label="Email"
          icon={<span className="material-symbols-outlined text-2xl">mail</span>}
          type="email"
          required
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <FloatingInput
          label="Mật khẩu"
          icon={<span className="material-symbols-outlined text-2xl">lock</span>}
          type="password"
          required
          value={form.mat_khau}
          onChange={e => setForm({ ...form, mat_khau: e.target.value })}
        />

        <button
          disabled={loading}
          className="w-full mt-4 rounded-xl bg-[#1a7a4a] py-3.5 text-base font-bold text-white transition-all duration-200 hover:bg-[#14633b] hover:shadow-lg hover:shadow-[#1a7a4a]/20 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
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

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-bold tracking-widest uppercase text-slate-400">hoặc</span>
        </div>
      </div>

      <p className="mt-8 text-center text-base text-slate-600">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-bold text-[#1a7a4a] hover:underline underline-offset-2">
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
      <div className="md:hidden mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1a7a4a]/10 px-3.5 py-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1a7a4a] animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase text-[#1a7a4a]">Chợ Nông Sản</span>
        </div>
      </div>

      <p className="text-xs font-bold tracking-widest uppercase text-[#1a7a4a] mb-1.5">Tạo mới tài khoản</p>
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Đăng ký</h2>
      <p className="mt-1.5 text-slate-500 text-base">Bắt đầu hành trình mua sắm nông sản sạch.</p>

      {error && (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <span className="material-symbols-outlined text-red-500 text-xl">error</span>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <FloatingInput
          label="Họ và tên"
          icon={<span className="material-symbols-outlined text-2xl">person</span>}
          required
          value={form.ho_ten}
          onChange={e => setForm({ ...form, ho_ten: e.target.value })}
        />
        <FloatingInput
          label="Email"
          icon={<span className="material-symbols-outlined text-2xl">mail</span>}
          type="email"
          required
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <FloatingInput
          label="Số điện thoại"
          icon={<span className="material-symbols-outlined text-2xl">call</span>}
          type="tel"
          value={form.so_dien_thoai}
          onChange={e => setForm({ ...form, so_dien_thoai: e.target.value })}
        />
        <FloatingInput
          label="Mật khẩu (tối thiểu 6 ký tự)"
          icon={<span className="material-symbols-outlined text-2xl">shield</span>}
          type="password"
          minLength={6}
          required
          value={form.mat_khau}
          onChange={e => setForm({ ...form, mat_khau: e.target.value })}
        />

        <button
          disabled={loading}
          className="w-full mt-4 rounded-xl bg-[#e85d04] py-3.5 text-base font-bold text-white transition-all duration-200 hover:bg-[#d45303] hover:shadow-lg hover:shadow-[#e85d04]/20 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
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

      <p className="mt-8 text-center text-base text-slate-600">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-bold text-[#1a7a4a] hover:underline underline-offset-2">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}