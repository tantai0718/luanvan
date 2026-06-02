import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { categoryAPI, productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const placeholderImage = 'https://placehold.co/720x900/edf3ee/0f5238?text=Farm2Table';

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
    <Link to={`/products/${product.ma_san_pham}`} className="group overflow-hidden rounded-2xl border border-[#d7ddd8] bg-white shadow-sm hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-[#efeded]">
        <img src={product.images?.[0] || placeholderImage} alt={product.ten_san_pham} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {stock > 0 ? <span className="absolute left-4 top-4 rounded-lg bg-[#2d6a4f] px-3 py-1 text-xs font-bold uppercase text-[#d8ffeb]">Còn hàng</span> : <span className="absolute left-4 top-4 rounded-lg bg-[#404943] px-3 py-1 text-xs font-bold uppercase text-white">Tạm hết</span>}
      </div>
      <div className="p-5">
        <h2 className="line-clamp-2 min-h-[48px] text-base font-semibold leading-6">{product.ten_san_pham}</h2>
        <p className="mt-2 text-sm text-[#404943]">{product.ten_nong_trai || 'Farm2Table'} · {product.don_vi}</p>
        <p className="mt-3 text-2xl font-bold text-[#0f5238]">{formatCurrency(product.gia_ban)}</p>
        <button onClick={handleAdd} disabled={stock <= 0} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${stock <= 0 ? 'bg-[#efeded] text-[#707973]' : added ? 'bg-[#b1f0ce] text-[#0f5238]' : 'bg-[#0f5238] text-white hover:bg-[#0a402b]'}`}>
          <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
          {stock <= 0 ? 'Tạm hết hàng' : added ? 'Đã thêm' : 'Thêm vào giỏ'}
        </button>
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

  return (
    <div className="market-shell">
      <div className="market-page grid gap-8 py-8 lg:grid-cols-[260px_1fr] lg:py-12">
        <aside className="hidden space-y-8 lg:sticky lg:top-28 lg:block lg:self-start">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide">Loại sản phẩm</h2>
            <div className="mt-5 grid gap-3">
              <button onClick={() => setParam('category', '')} className="flex items-center gap-3 text-left text-sm">
                <span className={`h-6 w-6 rounded border ${!category ? 'border-[#0f5238] bg-[#0f5238]' : 'border-[#707973] bg-white'}`} />
                Tất cả
              </button>
              {categories.map(item => (
                <button key={item.id} onClick={() => setParam('category', String(item.id))} className="flex items-center gap-3 text-left text-sm">
                  <span className={`h-6 w-6 rounded border ${category === String(item.id) ? 'border-[#0f5238] bg-[#0f5238]' : 'border-[#707973] bg-white'}`} />
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide">Tình trạng</h2>
            <button onClick={() => setParam('in_stock', inStock === '1' ? '' : '1')} className={`mt-4 rounded-full border px-4 py-2 text-sm ${inStock === '1' ? 'border-[#0f5238] bg-[#0f5238] text-white' : 'border-[#d7ddd8] bg-white text-[#404943]'}`}>
              Chỉ hiện còn hàng
            </button>
          </div>
          <div className="hidden overflow-hidden rounded-2xl bg-[#122019] text-white lg:block">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCA9oWZ3E50LxtB0PmRQdC4izC3yS0RJ1_NKTxirv3WBuUt6ZKxZe9vqVfh_Sot7mlKJxkEOpFYajUOehK2vlXq6SmX8WUz0fYBpuYcPSp5clwX4_dfzW86ewDpGWTHHXDCjVLPjE6qNFCNIHR9x3QvA35NTqlIrF9tipc-bUlBysrP1p2buTUDaIXdD4lKd3slnaGru_pVMpKTOMk904H9FQif17LORzGS1x10FAYjcPSTcDLWBgDQFJCDm2JM3SzrspNDyZJMfm4" alt="Giỏ rau xanh" className="h-64 w-full object-cover opacity-80" />
            <div className="p-5">
              <p className="text-xs">Ưu đãi tuần này</p>
              <h3 className="mt-2 text-2xl font-bold">Giao nhanh cho rau xanh</h3>
              <Link to="/products" className="mt-4 inline-flex rounded-lg bg-[#a33d23] px-4 py-2 text-sm font-semibold">Xem ngay</Link>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="market-panel flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm">Hiển thị <strong className="text-[#0f5238]">{total}</strong> sản phẩm</p>
              <h1 className="mt-2 text-3xl font-bold">{q ? `Kết quả cho "${q}"` : 'Sản phẩm Farm2Table'}</h1>
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
            <button onClick={() => setParam('category', '')} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${!category ? 'bg-[#0f5238] text-white' : 'bg-white'}`}>Tất cả</button>
            {categories.map(item => <button key={item.id} onClick={() => setParam('category', String(item.id))} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${category === String(item.id) ? 'bg-[#0f5238] text-white' : 'bg-white'}`}>{item.name}</button>)}
            <button onClick={() => setParam('in_stock', inStock === '1' ? '' : '1')} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${inStock === '1' ? 'bg-[#a33d23] text-white' : 'bg-white'}`}>Còn hàng</button>
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
