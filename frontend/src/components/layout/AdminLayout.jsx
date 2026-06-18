import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/admin', icon: 'dashboard', label: 'Tổng quan' },
  { path: '/admin/accounts', icon: 'group', label: 'Tài khoản' },
  { path: '/admin/banners', icon: 'imagesmode', label: 'Banner' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentTitle = useMemo(() => {
    const matched = menuItems.find(item =>
      location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
    );
    return matched?.label || 'Quản trị';
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="market-shell">
      <div className="border-b border-[#dce7df] bg-[#1a7a4a] text-white">
        <div className="market-page flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <span className="material-symbols-outlined">shield_person</span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                Khu vực quản trị
              </p>
              <p className="text-lg font-bold">{currentTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl bg-white/10 px-4 py-2 text-sm md:block">
              {user?.name} · ID {user?.id}
            </div>
            <Link
              to="/"
              className="hidden items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#1a7a4a] hover:bg-[#e8f5ee] md:inline-flex"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Trang chủ</span>
            </Link>
            <button
              onClick={() => setMobileOpen(prev => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 md:hidden"
              aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            >
              <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="market-page grid gap-6 py-6 lg:grid-cols-[260px_1fr]">
        <aside className={`${mobileOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="market-panel overflow-hidden">
            <div className="border-b border-[#dce7df] bg-[#f3f7f4] p-5">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="mt-1 text-xs text-slate-500">Quản trị viên · ID {user?.id}</p>
            </div>

            <nav className="p-3">
              {menuItems.map(item => {
                const active =
                  location.pathname === item.path ||
                  (item.path !== '/admin' && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`mb-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                      active
                        ? 'bg-[#1a7a4a] text-white shadow-md'
                        : 'text-slate-700 hover:bg-[#f3f7f4]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[#dce7df] p-3">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e8f5ee] px-4 py-3 text-sm font-semibold text-[#1a7a4a] hover:bg-[#dff0e7]"
              >
                <span className="material-symbols-outlined text-[18px]">home</span>
                <span>Về trang chủ</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
