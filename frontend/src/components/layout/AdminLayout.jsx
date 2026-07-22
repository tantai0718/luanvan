import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/admin', icon: 'dashboard', label: 'Tổng quan' },
  { path: '/admin/accounts', icon: 'group', label: 'Tài khoản' },
  { path: '/admin/banners', icon: 'ad_units', label: 'Banner' },
  { path: '/admin/categories', icon: 'category', label: 'Danh mục' },
  { path: '/admin/products', icon: 'inventory_2', label: 'Sản phẩm' },
  { path: '/admin/seasons', icon: 'eco', label: 'Mùa vụ' },
  { path: '/admin/orders', icon: 'receipt_long', label: 'Đơn hàng' },
  { path: '/admin/reviews', icon: 'reviews', label: 'Đánh giá' },
  { path: '/admin/notifications', icon: 'campaign', label: 'Thông báo' },
  { path: '/admin/articles', icon: 'article', label: 'Bài viết' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentItem = useMemo(() => {
    return menuItems.find(item =>
      location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
    );
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const initials = (user?.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F6F5]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-[#E4E9E6] bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a7a4a] text-lg font-bold text-white">
            C
          </div>
          <div>
            <p className="text-base font-bold leading-tight text-[#153226]">Trang quản lý</p>
            <p className="text-xs text-[#8A968E]">Chợ Nông Sản</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {menuItems.map(item => {
            const active = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#E8F5EE] text-[#1a7a4a] font-semibold'
                    : 'text-[#5B675F] hover:bg-[#F4F6F5] hover:text-[#153226]'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${active ? 'text-[#1a7a4a]' : 'text-[#9AA59D]'}`}>
                  {item.icon}
                </span>
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#1a7a4a]" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#E4E9E6] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-[#F4F6F5] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a7a4a] text-sm font-bold text-white">
              {initials || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#153226]">{user?.name || 'Admin'}</p>
              <p className="truncate text-xs text-[#8A968E]">{user?.email || 'admin@chonongsan.vn'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E4E9E6] bg-white/90 px-4 py-4 backdrop-blur-sm lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-[#5B675F] hover:bg-[#F4F6F5] lg:hidden"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9AA59D]">Bảng điều khiển</p>
              <h1 className="text-xl font-bold text-[#153226]">{currentItem?.label || 'Admin'}</h1>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-[#E4E9E6] px-4 py-2 text-sm font-semibold text-[#5B675F] transition hover:bg-[#F4F6F5]"
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            <span className="hidden sm:inline">Xem trang chính</span>
          </Link>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
