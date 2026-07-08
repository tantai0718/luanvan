import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/products', icon: 'inventory_2', label: 'Sản phẩm' },
  { path: '/admin/categories', icon: 'category', label: 'Danh mục' },
  { path: '/admin/orders', icon: 'receipt_long', label: 'Đơn hàng' },
  { path: '/admin/accounts', icon: 'group', label: 'Tài khoản' },
  { path: '/admin/banners', icon: 'ad_units', label: 'Banner' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle = useMemo(() => {
    const matched = menuItems.find(item =>
      location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
    );
    return matched?.label || 'Admin Console';
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="h-full w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant flex flex-col py-md z-50">
        <div className="px-6 mb-8">
          <Link to="/" className="text-title-md font-title-md text-primary font-bold block">Admin Panel</Link>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Quản lý chợ nông sản</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => {
            const active = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mx-2 my-1 px-4 py-3 flex items-center gap-3 rounded-xl transition-all active:scale-95 ${
                  active
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-label-sm text-label-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 mt-auto">
          <div className="bg-surface-container-highest rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="font-label-sm text-on-surface font-bold truncate">{user?.name || 'Admin'}</p>
              <p className="text-label-xs text-on-surface-variant truncate">{user?.email || 'admin@chonongsan.vn'}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="flex justify-between items-center px-lg py-sm bg-surface-bright border-b border-outline-variant sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="font-title-md text-title-md text-primary">{currentTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-full hover:bg-surface-container-highest transition-all">
              <span className="material-symbols-outlined text-on-surface-variant">home</span>
            </Link>
            <button onClick={handleLogout} className="px-4 py-2 text-error font-bold hover:bg-error-container/20 rounded-xl transition-all text-label-sm">
              Đăng xuất
            </button>
          </div>
        </header>

        <div className="p-lg flex-1">
          {children}
        </div>

        <footer          className="w-full px-margin-mobile md:px-margin-desktop py-xl bg-surface-container-highest border-t border-outline-variant">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-headline-lg font-headline-lg text-primary">Chợ Nông Sản</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">© 2024 Chợ Nông Sản. Kết nối giá trị nông sản Việt.</p>
            </div>
            <div className="flex gap-8">
              <Link className="text-on-surface-variant hover:text-secondary transition-colors font-label-sm text-label-sm" to="/">Trang chủ</Link>
              <Link className="text-on-surface-variant hover:text-secondary transition-colors font-label-sm text-label-sm" to="/products">Sản phẩm</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
