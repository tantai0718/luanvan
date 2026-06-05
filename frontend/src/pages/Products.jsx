import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { categoryAPI, productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { pickCategoryImage, pickProductImage } from '../utils/marketImages';

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

function ProductTile({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const stock = Number(product.ton_kho || 0);

  const handleAdd = async event => {
    event.preventDefault();
    event.stopPropagation();
    if (!user || user.role !== 'buyer' || stock <= 0) return;
    await addToCart(product.ma_san_pham, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Link to={`/products/${product.ma_san_pham}`} className="group overflow-hidden rounded-2xl border border-[#d7ddd8] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#efeded]">
        <img src={pickProductImage(product)} alt={product.ten_san_pham} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {stock > 0 ? (
          <span className="absolute left-4 top-4 rounded-full bg-[#2d6a4f] px-3 py-1 text-xs font-bold text-[#d8ffeb]">Còn hàng</span>
        ) : (
          <span className="absolute left-4 top-4 rounded-full bg-[#404943] px-3 py-1 text-xs font-bold text-white">Tạm hết</span>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#707973]">{product.ten_danh_muc || 'Nông sản'}</p>
        <h2 className="mt-2 line-clamp-2 min-h-[48px] text-base font-semibold leading-6">{product.ten_san_pham}</h2>
        <p className="mt-2 text-sm text-[#404943]">{product.ten_nong_trai || product.tinh_thanh || 'Farm2Table'} · {product.don_vi}</p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="text-2xl font-bold text-[#0f5238]">{formatCurrency(product.gia_ban)}</p>
          <button onClick={handleAdd} disabled={stock <= 0} className={`flex h-10 w-10 items-center justify-center rounded-full ${stock <= 0 ? 'bg-[#efeded] text-[#707973]' : added ? 'bg-[#0f5238] text-white' : 'bg-[#b1f0ce] text-[#0f5238] hover:bg-[#0f5238] hover:text-white'}`}>
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function Products() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'moi_nhat';
  const inStock = searchParams.get('in_stock') || '';
  const page = Number(searchParams.get('page') || 1);
  const limit = 12;

  useEffect(() => {
    categoryAPI.getAll().then(data => setCategories(data.categories || [])).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), page: String(page), sort });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (inStock) params.set('in_stock', inStock);
    productAPI.getAll(`?${params.toString()}`)
      .then(data => {
        setProducts(data.products || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [category, inStock, page, q, sort]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const activeCategory = categories.find(item => String(item.id) === String(category));

  return (
    <div className="market-shell">
      <div className="market-page grid gap-8 py-8 lg:grid-cols-[260px_1fr] lg:py-12">
        <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#b1f0ce]">Loại sản phẩm</h2>
            <div className="mt-5 grid gap-3">
              <button onClick={() => setParam('category', '')} className="flex items-center gap-3 text-left text-sm">
                <span className={`h-5 w-5 rounded border ${!category ? 'border-[#0f5238] bg-[#0f5238]' : 'border-[#707973] bg-white'}`} />
                <span className="text-white/85">Tất cả</span>
              </button>
              {categories.map(item => (
                <button key={item.id} onClick={() => setParam('category', String(item.id))} className="flex items-center gap-3 text-left text-sm">
                  <span className={`h-5 w-5 rounded border ${category === String(item.id) ? 'border-[#0f5238] bg-[#0f5238]' : 'border-[#707973] bg-white'}`} />
                  <span className="text-white/85">{item.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#b1f0ce]">Tình trạng</h2>
            <button onClick={() => setParam('in_stock', inStock === '1' ? '' : '1')} className={`mt-4 rounded-full border px-4 py-2 text-sm ${inStock === '1' ? 'border-[#b1f0ce] bg-[#b1f0ce] text-[#063d2b]' : 'border-[#2d6a4f] bg-white/10 text-white'}`}>
              Chỉ hiện còn hàng
            </button>
          </section>

          <section className="relative hidden aspect-[3/4] overflow-hidden rounded-2xl lg:block">
            <img src={activeCategory ? pickCategoryImage(activeCategory) : '/images/raucu.webp'} alt="Ưu đãi nông sản" className="h-full w-full object-cover transition duration-700 hover:scale-105" />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/15 to-transparent p-6 text-white">
              <p className="text-xs">Ưu đãi tuần này</p>
              <h3 className="mt-2 text-2xl font-bold">Giảm 20% nông sản theo mùa</h3>
              <button onClick={() => setParam('in_stock', '1')} className="mt-4 w-fit rounded-lg bg-[#a33d23] px-4 py-2 text-sm font-semibold">Xem ngay</button>
            </div>
          </section>
        </aside>

        <section className="min-w-0">
          <div className="market-panel flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm">Hiển thị <strong className="text-[#0f5238]">{total}</strong> sản phẩm</p>
              <h1 className="mt-2 text-3xl font-bold">{q ? `Kết quả cho "${q}"` : activeCategory?.name || 'Sản phẩm Farm2Table'}</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_180px]">
              <input value={q} onChange={event => setParam('q', event.target.value)} placeholder="Tìm nông sản..." className="market-field px-4 py-3 text-sm" />
              <select value={sort} onChange={event => setParam('sort', event.target.value)} className="market-field px-4 py-3 text-sm">
                <option value="moi_nhat">Mới nhất</option>
                <option value="gia_tang">Giá tăng dần</option>
                <option value="gia_giam">Giá giảm dần</option>
                <option value="ban_chay">Bán chạy</option>
                <option value="danh_gia">Đánh giá cao</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            <button onClick={() => setParam('category', '')} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${!category ? 'bg-[#b1f0ce] text-[#063d2b]' : 'bg-white/10 text-white'}`}>Tất cả</button>
            {categories.map(item => <button key={item.id} onClick={() => setParam('category', String(item.id))} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${category === String(item.id) ? 'bg-[#b1f0ce] text-[#063d2b]' : 'bg-white/10 text-white'}`}>{item.name}</button>)}
            <button onClick={() => setParam('in_stock', inStock === '1' ? '' : '1')} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${inStock === '1' ? 'bg-[#ffdad2] text-[#83260e]' : 'bg-white/10 text-white'}`}>Còn hàng</button>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[480px] animate-pulse rounded-2xl bg-white" />)}</div>
          ) : products.length ? (
            <>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map(product => <ProductTile key={product.ma_san_pham} product={product} />)}
              </div>
              {totalPages > 1 ? (
                <div className="mt-10 flex justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button key={index} onClick={() => setParam('page', String(index + 1))} className={`h-11 min-w-11 rounded-lg border px-3 text-sm font-semibold ${page === index + 1 ? 'border-[#0f5238] bg-[#0f5238] text-white' : 'border-[#d7ddd8] bg-white'}`}>{index + 1}</button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d7ddd8] bg-white py-20 text-center text-[#404943]">Không tìm thấy sản phẩm phù hợp.</div>
          )}
        </section>
      </div>
    </div>
  );
}
