import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categoryAPI, productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const currency = value => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);
  const image = product.images?.[0] || 'https://placehold.co/800x600/f1f5f2/2f5d50?text=Nong+san';

  const handleAdd = async event => {
    event.preventDefault();
    if (!user || user.role !== 'buyer') return;

    try {
      await addToCart(product.ma_san_pham, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch {}
  };

  return (
    <Link
      to={`/products/${product.ma_san_pham}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
    >
      <div className="relative h-52 overflow-hidden">
        <img src={image} alt={product.ten_san_pham} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
            {product.ten_danh_muc || 'Nông sản'}
          </span>
        </div>
        {product.ton_kho === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-stone-700">Hết hàng</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-400">
          {product.ten_nong_trai} | {product.tinh_thanh}
        </p>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-stone-900">{product.ten_san_pham}</h3>
        <p className="mt-4 text-2xl font-bold text-emerald-800">{currency(product.gia_ban)}</p>
        <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Đơn vị {product.don_vi}</p>

        <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
          <span className="text-sm text-stone-500">Tồn kho {product.ton_kho}</span>
          {user?.role === 'buyer' && product.ton_kho > 0 && (
            <button
              onClick={handleAdd}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                added ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-900 text-white hover:bg-emerald-800'
              }`}
            >
              {added ? 'Đã thêm' : 'Thêm giỏ'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    categoryAPI.getAll().then(data => setCategories(data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 8 });
    if (activeCategory) params.set('category', activeCategory);
    if (search) params.set('q', search);

    productAPI
      .getAll(`?${params}`)
      .then(data => setProducts(data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen bg-[#f7f3eb]">
      <section className="border-b border-stone-200 bg-gradient-to-b from-[#f3ecdf] to-[#f7f3eb]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">Chợ nông sản sạch</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-[-0.03em] text-stone-900 md:text-6xl">
                Nông sản tươi mỗi ngày, mua bán đơn giản và dễ tìm hơn.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600">
                Tập trung vào điều quan trọng nhất: tìm sản phẩm nhanh, xem danh mục rõ ràng và mua hàng không rối mắt.
              </p>

              <form
                onSubmit={event => {
                  event.preventDefault();
                  navigate(`/products?q=${search}`);
                }}
                className="mt-8 flex max-w-2xl flex-col gap-3 rounded-[28px] border border-stone-200 bg-white p-3 shadow-sm md:flex-row"
              >
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Tìm rau củ, trái cây, hạt, đặc sản..."
                  className="flex-1 rounded-2xl bg-stone-50 px-5 py-4 text-sm text-stone-700 outline-none placeholder:text-stone-400"
                />
                <button type="submit" className="rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-900">
                  Tìm sản phẩm
                </button>
              </form>
            </div>

            <div className="rounded-[30px] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Mua nhanh</p>
              <div className="mt-5 space-y-4">
                {[
                  ['Rau củ tươi', 'Nhóm hàng bán chạy mỗi ngày'],
                  ['Trái cây theo mùa', 'Cập nhật theo nguồn cung hiện có'],
                  ['Xem toàn bộ sản phẩm', 'Lọc nhanh theo danh mục và giá'],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl bg-stone-50 px-4 py-4">
                    <p className="text-sm font-semibold text-stone-900">{title}</p>
                    <p className="mt-1 text-sm text-stone-500">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[30px] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Danh mục</p>
              <h2 className="mt-2 text-2xl font-bold text-stone-900">Chọn nhanh theo nhóm sản phẩm</h2>
            </div>
            <Link to="/products" className="text-sm font-semibold text-emerald-800 hover:text-emerald-900">
              Xem toàn bộ danh mục
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {[{ id: null, icon: '🏷️', name: 'Tất cả' }, ...categories].map(category => (
              <button
                key={category.id ?? 'all'}
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeCategory === category.id
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Nổi bật</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-stone-900">Sản phẩm đang được quan tâm</h2>
          </div>
          <Link to="/products" className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:border-emerald-700 hover:text-emerald-800">
            Xem tất cả
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(8)].map((_, index) => <div key={index} className="h-[360px] animate-pulse rounded-3xl bg-white" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-semibold text-stone-700">Không tìm thấy sản phẩm phù hợp</p>
            <p className="mt-2 text-sm text-stone-500">Thử đổi từ khóa tìm kiếm hoặc bộ lọc danh mục.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {products.map(product => (
              <ProductCard key={product.ma_san_pham} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Cho nhà bán hàng</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-900">Bạn là nông dân và muốn đăng sản phẩm lên chợ?</h2>
            <p className="mt-2 text-sm leading-7 text-stone-500">
              Đăng ký tài khoản để quản lý sản phẩm, cập nhật giá và bán trực tiếp đến người mua.
            </p>
          </div>
          <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900">
            Đăng ký bán hàng
          </Link>
        </div>
      </section>
    </div>
  );
}
