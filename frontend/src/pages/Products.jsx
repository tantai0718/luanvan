import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { categoryAPI, productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}₫`;
const PLACEHOLDER = 'https://placehold.co/300x220/e8f5e9/2e7d32?text=N%C3%B4ng+s%E1%BA%A3n';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);
  const image = product.images?.[0] || PLACEHOLDER;

  const handleAdd = async event => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await addToCart(product.ma_san_pham, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch {}
  };

  return (
    <Link
      to={`/products/${product.ma_san_pham}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={product.ten_san_pham} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {Number(product.ton_kho) <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-700">Hết hàng</span>
          </div>
        )}
        {Number(product.ton_kho) > 0 && Number(product.ton_kho) <= Number(product.ton_kho_toi_thieu || 0) && (
          <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-medium text-white">Sắp hết</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs font-medium text-emerald-700 line-clamp-1">
          {product.ten_nong_trai || 'Nông trại'} {product.tinh_thanh ? `· ${product.tinh_thanh}` : ''}
        </p>
        <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold text-stone-800">{product.ten_san_pham}</h3>

        {Number(product.diem_danh_gia) > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-stone-400">
            <span className="text-yellow-500">{'★'.repeat(Math.round(product.diem_danh_gia || 0))}</span>
            <span>({product.tong_danh_gia || 0} đánh giá)</span>
          </div>
        )}

        <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-4">
          <div>
            <p className="text-base font-bold text-emerald-700">{formatCurrency(product.gia_ban)}</p>
            <p className="text-xs text-stone-400">/{product.don_vi}</p>
          </div>

          {user?.role === 'buyer' && Number(product.ton_kho) > 0 && (
            <button
              onClick={handleAdd}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                added ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-700 text-white hover:bg-emerald-800'
              }`}
            >
              {added ? 'Đã thêm' : '+ Giỏ hàng'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

function FilterBlock({ title, children }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{title}</p>
      {children}
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'moi_nhat';
  const province = searchParams.get('province') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const inStock = searchParams.get('in_stock') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 12;

  useEffect(() => {
    categoryAPI
      .getAll()
      .then(data => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
      sort,
    });

    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (province) params.set('province', province);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (inStock) params.set('in_stock', inStock);

    productAPI
      .getAll(`?${params.toString()}`)
      .then(data => {
        setProducts(data.products || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [q, category, sort, province, minPrice, maxPrice, inStock, page]);

  const setParam = (key, value) => {
    const params = new URLSearchParams(searchParams);

    if (value) params.set(key, value);
    else params.delete(key);

    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    ['category', 'province', 'min_price', 'max_price', 'in_stock'].forEach(key => params.delete(key));
    params.delete('page');
    setSearchParams(params);
  };

  const totalPages = Math.ceil(total / limit);
  const provinces = useMemo(
    () => [...new Set(products.map(product => product.tinh_thanh).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
    [products]
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-stone-200 bg-white px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-800">
                {q ? `Kết quả cho: "${q}"` : 'Tất cả sản phẩm'}
              </h1>
              <p className="mt-2 text-sm text-stone-500">
                {total > 0 ? `${total} sản phẩm đang hiển thị` : 'Chọn sản phẩm phù hợp từ các nông trại trên hệ thống'}
              </p>
            </div>

            <form
              onSubmit={event => {
                event.preventDefault();
                setParam('q', event.target.q.value.trim());
              }}
              className="flex w-full max-w-md gap-2"
            >
              <input
                name="q"
                defaultValue={q}
                placeholder="Tìm sản phẩm, mô tả..."
                className="flex-1 rounded-2xl border border-stone-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <button type="submit" className="rounded-2xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800">
                Tìm
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-20 lg:w-72 lg:self-start">
          <FilterBlock title="Danh mục">
            <div className="space-y-1">
              {[{ id: '', name: 'Tất cả' }, ...categories].map(item => {
                const active = (category || '') === String(item.id || '');
                return (
                  <button
                    key={String(item.id || 'all')}
                    onClick={() => setParam('category', item.id || '')}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      active ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {item.icon ? `${item.icon} ` : ''}
                    {item.name}
                  </button>
                );
              })}
            </div>
          </FilterBlock>

          <FilterBlock title="Lọc nhanh">
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-600">Tỉnh thành</label>
                <input
                  value={province}
                  onChange={event => setParam('province', event.target.value)}
                  list="province-options"
                  placeholder="Ví dụ: Đồng Tháp"
                  className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <datalist id="province-options">
                  {provinces.map(item => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-600">Giá từ</label>
                  <input
                    value={minPrice}
                    onChange={event => setParam('min_price', event.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-600">Đến</label>
                  <input
                    value={maxPrice}
                    onChange={event => setParam('max_price', event.target.value.replace(/\D/g, ''))}
                    placeholder="500000"
                    className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={inStock === '1'}
                  onChange={event => setParam('in_stock', event.target.checked ? '1' : '')}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
                />
                Chỉ hiện sản phẩm còn hàng
              </label>

              <button onClick={clearFilters} className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50">
                Xóa bộ lọc
              </button>
            </div>
          </FilterBlock>

          <FilterBlock title="Sắp xếp">
            <div className="space-y-1">
              {[
                ['moi_nhat', 'Mới nhất'],
                ['gia_tang', 'Giá tăng dần'],
                ['gia_giam', 'Giá giảm dần'],
                ['ban_chay', 'Bán chạy'],
                ['danh_gia', 'Đánh giá cao'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setParam('sort', value)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    sort === value ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </FilterBlock>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-3xl border border-stone-200 bg-white" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white py-20 text-center text-stone-400">
              <div className="mb-3 text-5xl">🔍</div>
              <p className="font-medium">Không tìm thấy sản phẩm phù hợp</p>
              <p className="mt-2 text-sm">Bạn thử đổi từ khóa hoặc nới lỏng bộ lọc nhé.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                <span className="rounded-full bg-white px-3 py-1.5">{total} sản phẩm</span>
                {province && <span className="rounded-full bg-white px-3 py-1.5">Khu vực: {province}</span>}
                {inStock === '1' && <span className="rounded-full bg-white px-3 py-1.5">Còn hàng</span>}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {products.map(product => (
                  <ProductCard key={product.ma_san_pham} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setParam('page', String(index + 1))}
                      className={`h-9 w-9 rounded-xl text-sm font-medium transition-colors ${
                        page === index + 1
                          ? 'bg-emerald-700 text-white'
                          : 'border border-stone-200 bg-white text-stone-600 hover:border-emerald-400'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
