import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Image, LayoutGrid, Package, Leaf, Tag, ReceiptText, Star, Megaphone, FileText, LogOut, Menu, X, Store } from 'lucide-react';

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Tổng quan' },
  { path: '/admin/accounts', icon: Users, label: 'Tài khoản' },
  { path: '/admin/banners', icon: Image, label: 'Banner' },
  { path: '/admin/categories', icon: LayoutGrid, label: 'Danh mục' },
  { path: '/admin/products', icon: Package, label: 'Sản phẩm' },
  { path: '/admin/seasons', icon: Leaf, label: 'Mùa vụ' },
  { path: '/admin/promotions', icon: Tag, label: 'Khuyến mãi' },
  { path: '/admin/orders', icon: ReceiptText, label: 'Đơn hàng' },
  { path: '/admin/reviews', icon: Star, label: 'Đánh giá' },
  { path: '/admin/notifications', icon: Megaphone, label: 'Thông báo' },
  { path: '/admin/articles', icon: FileText, label: 'Bài viết' },
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
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-btn bg-primary text-lg font-bold text-white">C</div>
          <div>
            <p className="text-body font-bold text-text-primary">Trang quản lý</p>
            <p className="text-caption text-text-secondary">Chợ Nông Sản</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {menuItems.map(item => {
            const active = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-btn px-4 py-3 text-body font-medium transition-all duration-200 ${
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`}
              >
                <Icon size={20} className={active ? 'text-primary' : 'text-text-secondary/60'} />
                {item.label}
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-btn bg-background p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {initials || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-semibold text-text-primary">{user?.name || 'Admin'}</p>
              <p className="truncate text-caption text-text-secondary">{user?.email || 'admin@chonongsan.vn'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-btn px-4 py-2.5 text-body font-medium text-danger hover:bg-red-50 transition-all">
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 px-4 py-4 backdrop-blur-sm lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-btn p-2 text-text-secondary hover:bg-background lg:hidden transition-all">
              <Menu size={20} />
            </button>
            <div>
              <p className="text-caption font-medium uppercase tracking-wider text-text-secondary">Bảng điều khiển</p>
              <h1 className="text-h3 text-text-primary">{currentItem?.label || 'Admin'}</h1>
            </div>
          </div>
          <Link to="/" className="flex items-center gap-2 rounded-btn border border-border px-4 py-2 text-body font-medium text-text-secondary hover:bg-background transition-all">
            <Store size={18} />
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
