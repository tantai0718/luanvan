import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { notificationAPI } from '../../services/api';

const links = [
  { to: '/', label: 'Trang chủ' },
  { to: '/products', label: 'Sản phẩm' },
  { to: '/about', label: 'Về chúng tôi' },
];

const loaiLabelMap = {
  he_thong: { label: 'Hệ thống', color: 'bg-slate-100 text-slate-600' },
  khuyen_mai: { label: 'Khuyến mãi', color: 'bg-amber-50 text-amber-700' },
  don_hang: { label: 'Đơn hàng', color: 'bg-[#e8f5ee] text-[#1a7a4a]' },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = () => {
    setLoading(true);
    notificationAPI.getAll()
      .then(data => {
        setNotifications(data.notifications || []);
        setUnread(Number(data.chua_doc || 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll mỗi 60s
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open) fetchNotifications();
  };

  const handleMarkRead = async (matb) => {
    setNotifications(prev => prev.map(n => n.matb === matb ? { ...n, da_doc: 1 } : n));
    setUnread(prev => Math.max(0, prev - 1));
    try {
      await notificationAPI.markRead(matb);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, da_doc: 1 })));
    setUnread(0);
    try {
      await notificationAPI.markAllRead();
    } catch {}
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative hover:bg-surface-container-low p-2 rounded-full transition-all active:scale-95"
      >
        <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-80 max-h-[420px] overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low border-b border-outline-variant sticky top-0">
              <p className="font-semibold text-on-surface text-body-md">Thông báo</p>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-6 text-center text-sm text-on-surface-variant">Đang tải...</div>
            ) : notifications.length ? (
              <div className="divide-y divide-outline-variant/60">
                {notifications.map(n => {
                  const meta = loaiLabelMap[n.loai] || loaiLabelMap.he_thong;
                  return (
                    <button
                      key={n.matb}
                      onClick={() => !n.da_doc && handleMarkRead(n.matb)}
                      className={`block w-full text-left px-4 py-3 hover:bg-surface-container transition-colors ${!n.da_doc ? 'bg-[#f3f9f5]' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.da_doc && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${!n.da_doc ? 'font-semibold text-on-surface' : 'font-medium text-on-surface-variant'}`}>
                              {n.tieu_de}
                            </p>
                          </div>
                          <p className="mt-0.5 text-xs leading-5 text-on-surface-variant line-clamp-2">{n.noi_dung}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className="text-[11px] text-on-surface-variant/70">{timeAgo(n.ngay_tao)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-on-surface-variant">
                Bạn chưa có thông báo nào.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  const initials = useMemo(() => {
    if (!user?.name) return 'FT';
    return user.name.split(' ').slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }, [user?.name]);

  const handleSearch = e => {
    e.preventDefault();
    navigate(search.trim() ? `/products?q=${encodeURIComponent(search.trim())}` : '/products');
    setMobileOpen(false);
  };

  const handleLogout = () => { logout(); setMenuOpen(false); navigate('/'); };

  return (
    <header className="bg-surface shadow-sm sticky top-0 z-50 transition-all duration-300">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-title-md font-title-md font-black text-primary">
            Chợ Nông Sản
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {links.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'text-primary font-bold border-b-2 border-primary pb-1 font-body-md text-body-md'
                    : 'text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md'
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'buyer' && (
              <NavLink to="/orders" className={({ isActive }) =>
                isActive ? 'text-primary font-bold border-b-2 border-primary pb-1 font-body-md text-body-md' : 'text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md'
              }>Đơn hàng</NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) =>
                isActive ? 'text-primary font-bold border-b-2 border-primary pb-1 font-body-md text-body-md' : 'text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md'
              }>Quản trị</NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(e)}
              className="bg-transparent border-none focus:ring-0 text-body-md placeholder:text-on-surface-variant/60 w-64 outline-none"
              placeholder="Tìm kiếm nông sản..."
            />
          </div>

          <div className="flex items-center gap-3">
            {user && <NotificationBell />}

            {user?.role === 'buyer' && (
              <Link to="/cart" className="hover:bg-surface-container-low p-2 rounded-full transition-all active:scale-95 relative">
                <span className="material-symbols-outlined text-on-surface-variant">shopping_cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(p => !p)}
                  className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all"
                >
                  <div className="w-full h-full bg-primary text-on-primary text-sm font-bold flex items-center justify-center">
                    {initials}
                  </div>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-11 z-20 w-60 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg overflow-hidden">
                      <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant">
                        <p className="font-semibold text-on-surface text-body-md">{user.name}</p>
                        <p className="text-label-sm text-on-surface-variant mt-0.5">
                          {user.role === 'admin' ? 'Quản trị viên' : 'Người mua'}
                        </p>
                      </div>
                      <div className="p-1">
                        <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-body-md text-on-surface hover:bg-surface-container transition-colors">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
                          Hồ sơ cá nhân
                        </Link>
                        {user.role === 'buyer' && (
                          <Link to="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-body-md text-on-surface hover:bg-surface-container transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">receipt_long</span>
                            Đơn hàng của tôi
                          </Link>
                        )}
                        <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-body-md text-error hover:bg-error-container/20 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">logout</span>
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-primary text-on-primary rounded-xl font-title-md text-title-md hover:bg-on-primary-fixed-variant transition-all active:scale-95">
                Đăng nhập
              </Link>
            )}

            <button onClick={() => setMobileOpen(p => !p)} className="md:hidden p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-all">
              <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-outline-variant bg-surface px-margin-mobile py-3">
          <form onSubmit={handleSearch} className="flex items-center bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant mb-3">
            <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="flex-1 bg-transparent text-body-md outline-none placeholder:text-on-surface-variant/60"
            />
          </form>
          <nav className="grid gap-1">
            {links.map(item => (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
                {item.label}
              </Link>
            ))}
            {user?.role === 'buyer' && (
              <Link to="/orders" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-lg text-body-md text-on-surface hover:bg-surface-container-low transition-colors">Đơn hàng</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}