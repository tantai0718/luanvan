import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
    setOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 text-stone-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-800 text-lg text-white">
            🌿
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400">Chợ nông sản</p>
            <p className="text-base font-bold">Nông sản sạch mỗi ngày</p>
          </div>
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/" className="text-stone-600 transition-colors hover:text-emerald-800">Trang chủ</Link>
          <Link to="/products" className="text-stone-600 transition-colors hover:text-emerald-800">Sản phẩm</Link>
          {user?.role === 'admin' && <Link to="/admin" className="text-stone-600 transition-colors hover:text-emerald-800">Quản trị</Link>}
          {user?.role === 'farmer' && <Link to="/farmer/dashboard" className="text-stone-600 transition-colors hover:text-emerald-800">Nông trại</Link>}
          {user?.role === 'farmer' && <Link to="/farmer/products" className="text-stone-600 transition-colors hover:text-emerald-800">Sản phẩm của tôi</Link>}
          {user?.role === 'farmer' && <Link to="/farmer/orders" className="text-stone-600 transition-colors hover:text-emerald-800">Đơn hàng</Link>}
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'buyer' && (
            <Link to="/cart" className="relative rounded-full p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-emerald-800">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-stone-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-sm font-bold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium text-stone-700 sm:block">{user.name}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1 shadow-xl">
                  <div className="border-b border-stone-100 px-4 py-3">
                    <p className="text-sm font-semibold text-stone-900">{user.name}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-400">{user.role}</p>
                  </div>

                  <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50">
                    Hồ sơ cá nhân
                  </Link>

                  {user.role === 'buyer' && (
                    <Link to="/orders" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50">
                      Đơn hàng của tôi
                    </Link>
                  )}
                  {user.role === 'farmer' && (
                    <Link to="/farmer/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50">
                      Hồ sơ nông trại
                    </Link>
                  )}
                  {user.role === 'farmer' && (
                    <Link to="/farmer/dashboard" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50">
                      Tổng quan nông trại
                    </Link>
                  )}
                  {user.role === 'farmer' && (
                    <Link to="/farmer/products" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50">
                      Quản lý sản phẩm
                    </Link>
                  )}
                  {user.role === 'farmer' && (
                    <Link to="/farmer/orders" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50">
                      Đơn hàng khách mua
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin/warehouse" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50">
                      Quản lý kho
                    </Link>
                  )}

                  <div className="my-1 border-t border-stone-100" />
                  <button onClick={handleLogout} className="block w-full px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50">
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-50">
                Đăng nhập
              </Link>
              <Link to="/register" className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-900">
                Đăng ký
              </Link>
            </div>
          )}

          <button onClick={() => setOpen(!open)} className="rounded-full p-2 text-stone-600 md:hidden">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
          <div className="space-y-1">
            <Link to="/" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Trang chủ</Link>
            <Link to="/products" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Sản phẩm</Link>
            {!user && <Link to="/login" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Đăng nhập</Link>}
            {!user && <Link to="/register" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Đăng ký</Link>}
            {user?.role === 'farmer' && <Link to="/farmer/dashboard" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Nông trại</Link>}
            {user?.role === 'farmer' && <Link to="/farmer/profile" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Hồ sơ nông trại</Link>}
            {user?.role === 'farmer' && <Link to="/farmer/products" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Sản phẩm của tôi</Link>}
            {user?.role === 'farmer' && <Link to="/farmer/orders" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Đơn hàng</Link>}
            {user?.role === 'admin' && <Link to="/admin" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Quản trị</Link>}
          </div>
        </div>
      )}
    </nav>
  );
}
