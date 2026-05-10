import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MENU = [
  { path: '/admin', icon: '📊', label: 'Tổng quan' },
  { path: '/admin/accounts', icon: '👥', label: 'Tài khoản' },
  { path: '/admin/farmers', icon: '🌾', label: 'Duyệt nông dân' },
  { path: '/admin/categories', icon: '📂', label: 'Danh mục' },
  { path: '/admin/products', icon: '🥬', label: 'Sản phẩm' },
  { path: '/admin/orders', icon: '🛒', label: 'Đơn hàng' },
  { path: '/admin/warehouse', icon: '🏭', label: 'Kho và hóa đơn' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentTitle =
    MENU.find(item => location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path)))?.label ||
    'Quản trị';

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100">
      <aside className={`${collapsed ? 'w-16' : 'w-60'} flex shrink-0 flex-col bg-stone-900 text-white transition-all duration-300`}>
        <div className="flex items-center gap-3 border-b border-stone-700 px-4 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-lg">
            🌿
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold">Chợ Nông Sản</p>
              <p className="text-xs text-stone-400">Khu vực quản trị</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {MENU.map(item => {
            const active = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mx-2 mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all ${
                  active ? 'bg-emerald-700 text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <span className="shrink-0 text-base">{item.icon}</span>
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone-700 p-3">
          {!collapsed && (
            <div className="mb-2 flex items-center gap-2 px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">{user?.name}</p>
                <p className="text-xs text-stone-500">Quản trị viên</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full rounded-xl px-2 py-2 text-xs text-stone-400 transition-all hover:bg-stone-800 hover:text-white ${collapsed ? 'text-center' : 'text-left'}`}
          >
            {collapsed ? '🚪' : '🚪 Đăng xuất'}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mt-1 w-full py-2 text-center text-xs text-stone-500 transition-colors hover:text-white"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
          <h1 className="text-sm font-semibold text-stone-700">{currentTitle}</h1>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
