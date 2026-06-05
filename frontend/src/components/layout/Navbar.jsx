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
    <header className="sticky top-0 z-40 border-b border-[#2d6a4f] bg-[#063d2b]/95 shadow-sm backdrop-blur">
      <div className="market-page flex min-h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="whitespace-nowrap text-xl font-bold text-[#0f5238] md:text-2xl">Farm2Table</Link>
          <nav className="hidden items-center gap-6 md:flex">
            {links.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg border-b-2 px-1 py-2 text-sm transition ${
                    isActive ? 'border-[#b1f0ce] font-bold text-[#b1f0ce]' : 'border-transparent text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'buyer' ? <NavLink to="/orders" className="rounded-lg px-1 py-2 text-sm text-white/80 hover:text-white">Đơn hàng</NavLink> : null}
            {user?.role === 'admin' ? <NavLink to="/admin" className="rounded-lg px-1 py-2 text-sm text-white/80 hover:text-white">Quản trị</NavLink> : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="hidden items-center rounded-xl bg-white/10 px-3 lg:flex">
            <span className="material-symbols-outlined text-[20px] text-white/75">search</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm kiếm nông sản..."
              className="w-52 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-white/60"
            />
          </form>

          {user?.role === 'buyer' ? (
            <Link to="/cart" aria-label="Giỏ hàng" className="relative rounded-lg p-2 text-[#b1f0ce] hover:bg-white/10">
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
              <button onClick={() => setMenuOpen(prev => !prev)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#b1f0ce]/40 bg-white/10 text-xs font-bold text-white">
                {initials}
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-12 w-64 rounded-xl border border-[#d7ddd8] bg-white p-3 text-[#1b1c1c] shadow-xl">
                  <div className="rounded-lg bg-[#f5f3f3] p-3">
                    <p className="font-semibold text-[#0f3f26]">{user.name}</p>
                    <p className="mt-1 text-xs text-[#404943]">{user.role === 'admin' ? 'Quản trị viên' : 'Người mua'}</p>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="mt-2 block rounded-lg px-3 py-2 text-sm hover:bg-[#f5f3f3]">Hồ sơ cá nhân</Link>
                  {user.role === 'buyer' ? <Link to="/orders" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-[#f5f3f3]">Đơn hàng của tôi</Link> : null}
                  <button onClick={handleLogout} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50">Đăng xuất</button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link to="/login" aria-label="Đăng nhập" className="rounded-lg p-2 text-[#b1f0ce] hover:bg-white/10">
              <span className="material-symbols-outlined">person</span>
            </Link>
          )}

          <button onClick={() => setMobileOpen(prev => !prev)} className="rounded-lg p-2 text-[#b1f0ce] hover:bg-white/10 md:hidden" aria-label="Mở menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="market-page border-t border-[#2d6a4f] py-4 md:hidden">
          <form onSubmit={handleSearch} className="mb-3 flex rounded-lg bg-white/10 px-3">
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm kiếm nông sản..." className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/60" />
            <button className="material-symbols-outlined text-[#b1f0ce]">search</button>
          </form>
          <nav className="grid gap-1">
            {links.map(item => <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/10">{item.label}</Link>)}
            {user?.role === 'buyer' ? <Link to="/orders" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/10">Đơn hàng</Link> : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
