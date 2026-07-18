import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

function AuthShell({ title, subtitle, children }) {
  return (
    // Wrapper ngoài cùng: Thêm khoảng đệm lớn hơn cho màn hình rộng
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/50 p-6 md:p-12">
      
      {/* KHUNG HÌNH CHỮ NHẬT CHÍNH: Nâng max-width lên 6xl (to và rộng hơn) */}
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[40px] bg-white shadow-[0_25px_60px_rgba(26,122,74,0.1)] border border-slate-100 lg:grid-cols-[0.95fr_1.05fr]">
        
        {/* CỘT TRÁI: Khối màu xanh lá gradient rộng rãi, phóng khoáng hơn */}
        <aside className="relative flex flex-col justify-between bg-gradient-to-br from-[#1a7a4a] to-[#2d9e63] p-10 md:p-16 text-white lg:rounded-r-[32px]">
          {/* Họa tiết vòng tròn trang trí */}
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100 backdrop-blur-sm">
              Chợ nông sản Việt
            </span>
            <h1 className="mt-10 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Giao diện tài khoản được rút gọn, rõ ràng và dễ dùng hơn.
            </h1>
            <p className="mt-8 text-base leading-relaxed text-white/90">
              "Để mang lại trải nghiệm mua sắm đơn giản và nhanh chóng nhất, mọi tài khoản đăng ký mới sẽ được thiết lập mặc định là Người mua. Hãy cùng khám phá nguồn nông sản sạch, an toàn và chất lượng ngay hôm nay!"
            </p>
          </div>

          <div className="relative z-10 mt-16 border-t border-white/10 pt-8">
            <p className="text-sm text-white/50">© 2026 Chợ nông sản Việt. Kết nối nông nghiệp sạch.</p>
          </div>
        </aside>
        <section className="flex flex-col justify-center px-8 py-14 sm:px-16 md:px-20 lg:px-14 xl:px-20">
          {/* Nâng max-width của cụm form từ md (448px) lên lg (512px) giúp form to và rõ hơn */}
          <div className="mx-auto w-full max-w-lg">
            <span className="text-sm font-bold uppercase tracking-[0.25em] text-[#2d9e63]">
              Tài khoản
            </span>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              {title}
            </h2>
            
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              {subtitle}
            </p>
            
            <div className="mt-10">{children}</div>
          </div>
        </section>

      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    mat_khau: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
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
      subtitle="Đăng nhập để tiếp tục mua hàng, theo dõi đơn hàng hoặc vào khu vực quản trị nếu bạn là quản trị viên."
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Địa chỉ Email"
          className="w-full rounded-2xl border border-[#dce7df] bg-[#fcfdfe] px-5 py-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2d9e63] focus:bg-white focus:ring-4 focus:ring-[#2d9e63]/10"
        />

        <input
          type="password"
          required
          value={form.mat_khau}
          onChange={(e) => setForm({ ...form, mat_khau: e.target.value })}
          placeholder="Mật khẩu"
          className="w-full rounded-2xl border border-[#dce7df] bg-[#fcfdfe] px-5 py-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2d9e63] focus:bg-white focus:ring-4 focus:ring-[#2d9e63]/10"
        />
        <button
          disabled={loading}
          className="w-full rounded-full bg-[#1a7a4a] py-4 text-base font-bold text-white transition-all hover:bg-[#14633b] hover:shadow-lg hover:shadow-emerald-950/10 active:scale-[0.98] disabled:opacity-75"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="mt-8 text-center text-base text-slate-500">
        Chưa có tài khoản?{' '}
        <Link
          to="/register"
          className="font-bold text-[#1a7a4a] hover:underline"
        >
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

  const handleSubmit = async (event) => {
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
      subtitle="Tài khoản mới mặc định là người mua để sử dụng các chức năng mua hàng, đặt trước và giao định kỳ."
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          required
          value={form.ho_ten}
          onChange={(e) => setForm({ ...form, ho_ten: e.target.value })}
          placeholder="Họ và tên"
          className="w-full rounded-2xl border border-[#dce7df] bg-[#fcfdfe] px-5 py-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2d9e63] focus:bg-white focus:ring-4 focus:ring-[#2d9e63]/10"
        />
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="w-full rounded-2xl border border-[#dce7df] bg-[#fcfdfe] px-5 py-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2d9e63] focus:bg-white focus:ring-4 focus:ring-[#2d9e63]/10"
        />
        <input
          value={form.so_dien_thoai}
          onChange={(e) => setForm({ ...form, so_dien_thoai: e.target.value })}
          placeholder="Số điện thoại"
          className="w-full rounded-2xl border border-[#dce7df] bg-[#fcfdfe] px-5 py-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2d9e63] focus:bg-white focus:ring-4 focus:ring-[#2d9e63]/10"
        />
        <input
          type="password"
          minLength={6}
          required
          value={form.mat_khau}
          onChange={(e) => setForm({ ...form, mat_khau: e.target.value })}
          placeholder="Mật khẩu (tối thiểu 6 ký tự)"
          className="w-full rounded-2xl border border-[#dce7df] bg-[#fcfdfe] px-5 py-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2d9e63] focus:bg-white focus:ring-4 focus:ring-[#2d9e63]/10"
        />
        <button
          disabled={loading}
          className="w-full rounded-full bg-[#e85d04] py-4 text-base font-bold text-white transition-all hover:bg-[#cf5408] hover:shadow-lg hover:shadow-orange-950/10 active:scale-[0.98] disabled:opacity-75"
        >
          {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </form>

      <p className="mt-8 text-center text-base text-slate-500">
        Đã có tài khoản?{' '}
        <Link
          to="/login"
          className="font-bold text-[#1a7a4a] hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}