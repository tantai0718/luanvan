import { useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const links = [
  { to: '/', label: 'Trang chủ' },
  { to: '/products', label: 'Sản phẩm' },
  { to: '/about', label: 'Về chúng tôi' },
  { to: '/about#news', label: 'Tin tức' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  const initials = useMemo(() => {
    if (!user?.name) return 'FT';
    return user.name.split(' ').slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
  }, [user?.name]);

  const handleSearch = event => {
    event.preventDefault();
    navigate(search.trim() ? `/products?q=${encodeURIComponent(search.trim())}` : '/products');
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#edf0ed] bg-[#f5f3f3]/95 backdrop-blur">
      <div className="market-page flex min-h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="whitespace-nowrap text-xl font-bold text-[#0f5238] md:text-2xl">Farm2Table</Link>
          <nav className="hidden items-center gap-6 md:flex">
            {links.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `border-b-2 py-2 text-sm ${isActive ? 'border-[#0f5238] font-bold text-[#0f5238]' : 'border-transparent text-[#404943] hover:text-[#0f5238]'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'buyer' ? <NavLink to="/orders" className="text-sm text-[#404943] hover:text-[#0f5238]">Đơn hàng</NavLink> : null}
            {user?.role === 'admin' ? <NavLink to="/admin" className="text-sm text-[#404943] hover:text-[#0f5238]">Quản trị</NavLink> : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="hidden items-center rounded-lg bg-[#efeded] px-3 lg:flex">
            <span className="material-symbols-outlined text-[20px] text-[#404943]">search</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm kiếm nông sản..."
              className="w-48 bg-transparent px-2 py-3 text-sm outline-none"
            />
          </form>

          {user?.role === 'buyer' ? (
            <Link to="/cart" aria-label="Giỏ hàng" className="relative rounded-lg p-2 text-[#0f5238] hover:bg-[#e4e2e2]">
              <span className="material-symbols-outlined">shopping_cart</span>
              {totalItems ? (
                <span className="absolute right-0 top-0 min-w-[17px] rounded-full bg-[#a33d23] px-1 text-center text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              ) : null}
            </Link>
          ) : null}

          {user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen(prev => !prev)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d7ddd8] bg-white text-xs font-bold text-[#0f5238]">
                {initials}
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-12 w-64 rounded-xl border border-[#d7ddd8] bg-white p-3 shadow-xl">
                  <div className="rounded-lg bg-[#f5f3f3] p-3">
                    <p className="font-semibold">{user.name}</p>
                    <p className="mt-1 text-xs text-[#404943]">{user.role === 'admin' ? 'Quản trị viên' : 'Người mua'}</p>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="mt-2 block rounded-lg px-3 py-2 text-sm hover:bg-[#f5f3f3]">Hồ sơ cá nhân</Link>
                  {user.role === 'buyer' ? <Link to="/orders" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-[#f5f3f3]">Đơn hàng của tôi</Link> : null}
                  <button onClick={handleLogout} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50">Đăng xuất</button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link to="/login" aria-label="Đăng nhập" className="rounded-lg p-2 text-[#0f5238] hover:bg-[#e4e2e2]">
              <span className="material-symbols-outlined">person</span>
            </Link>
          )}

          <button onClick={() => setMobileOpen(prev => !prev)} className="rounded-lg p-2 text-[#0f5238] hover:bg-[#e4e2e2] md:hidden" aria-label="Mở menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="market-page border-t border-[#edf0ed] py-4 md:hidden">
          <form onSubmit={handleSearch} className="mb-3 flex rounded-lg bg-[#efeded] px-3">
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm kiếm nông sản..." className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
            <button className="material-symbols-outlined text-[#0f5238]">search</button>
          </form>
          <nav className="grid gap-1">
            {links.map(item => <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-white">{item.label}</Link>)}
            {user?.role === 'buyer' ? <Link to="/orders" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-white">Đơn hàng</Link> : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
