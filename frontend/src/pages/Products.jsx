import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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

  const navigate = useNavigate();

  const handleAdd = async event => {
    event.preventDefault(); event.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer') {
      alert('Chỉ tài khoản người mua mới có thể thêm vào giỏ hàng.');
      return;
    }
    if (stock <= 0) return;
    try {
      await addToCart(product.ma_san_pham, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra, không thể thêm vào giỏ hàng.');
    }
  };

  return (
    <Link to={`/products/${product.ma_san_pham}`} className="bg-surface rounded-3xl p-4 border border-outline-variant organic-shadow flex flex-col group h-full transition-all hover:-translate-y-1">
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-surface-container-high">
        <img src={pickProductImage(product)} alt={product.ten_san_pham} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {stock <= 0 && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="bg-surface text-on-surface px-4 py-1.5 rounded-full font-label-sm text-label-sm">Tạm hết</span>
          </div>
        )}
      </div>
      <div className="flex-grow">
        <span className="text-primary font-label-sm text-label-sm uppercase tracking-wider">{product.ten_danh_muc || 'Nông sản'}</span>
        <h3 className="text-title-md font-title-md mt-1 mb-2 line-clamp-2">{product.ten_san_pham}</h3>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-secondary font-bold text-headline-lg">{formatCurrency(product.gia_ban)}</span>
          <span className="text-on-surface-variant/50 text-sm">/{product.don_vi}</span>
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={stock <= 0}
        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 ${
          stock <= 0
            ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
            : added
              ? 'bg-primary-container text-on-primary-container font-bold'
              : 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant'
        }`}
      >
        <span className="material-symbols-outlined text-sm">{stock <= 0 ? 'block' : added ? 'check' : 'shopping_cart'}</span>
        {stock <= 0 ? 'Hết hàng' : added ? 'Đã thêm' : 'Thêm vào giỏ'}
      </button>
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
    categoryAPI.getAll().then(data => {
      const list = data.categories || data || [];
      setCategories(list.filter(c => c.loai === 'san_pham'));
    }).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), page: String(page), sort });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (inStock) params.set('in_stock', inStock);
    productAPI.getAll(`?${params.toString()}`)
      .then(data => { setProducts(data.products || []); setTotal(data.total || 0); })
      .catch(() => { setProducts([]); setTotal(0); })
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
    <div className="bg-background min-h-screen py-xl">
      <div className="mx-auto grid w-full max-w-[1600px] gap-xl px-margin-mobile md:px-10 2xl:px-12 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar Filters */}
        <aside className="space-y-lg lg:sticky lg:top-28 lg:self-start">
          <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
            <h2 className="font-title-md text-title-md text-on-surface mb-6">Danh mục</h2>
            <div className="space-y-3">
              {[{ id: '', name: 'Tất cả sản phẩm' }, ...categories].map(item => (
                <button key={item.id} onClick={() => setParam('category', String(item.id))} className={`w-full text-left px-4 py-2.5 rounded-xl transition-all text-body-md font-body-md ${
                  category === String(item.id) ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
            <h2 className="font-title-md text-title-md text-on-surface mb-4">Tình trạng</h2>
            <button
              onClick={() => setParam('in_stock', inStock === '1' ? '' : '1')}
              className={`w-full rounded-xl border px-4 py-2.5 text-body-md font-body-md transition-all ${
                inStock === '1' ? 'bg-primary-fixed border-primary text-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Chỉ hiện còn hàng
            </button>
          </div>
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden organic-shadow hidden lg:block">
            <img src={activeCategory ? pickCategoryImage(activeCategory) : '/images/raucu.webp'} alt="Ưu đãi" className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex flex-col justify-end p-lg">
              <p className="text-white/80 text-label-sm">Ưu đãi tuần này</p>
              <h3 className="text-headline-lg font-headline-lg text-white mt-1">Giảm 20% nông sản theo mùa</h3>
              <button onClick={() => setParam('in_stock', '1')} className="mt-4 w-fit bg-secondary text-on-secondary px-4 py-2 rounded-xl font-bold transition-all active:scale-95">Xem ngay</button>
            </div>
          </div>
        </aside>

        {/* Products Section */}
        <section className="min-w-0">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-lg">
            <div>
              <h1 className="text-headline-lg font-headline-lg text-on-surface">{q ? `Kết quả cho "${q}"` : activeCategory?.name || 'Sản phẩm'}</h1>
              <p className="text-on-surface-variant text-body-md font-body-md">Hiển thị <strong className="text-primary">{total}</strong> sản phẩm</p>
            </div>
            <div className="flex gap-3">
              <input value={q} onChange={e => setParam('q', e.target.value)} placeholder="Tìm nông sản..." className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none w-48" />
              <select value={sort} onChange={e => setParam('sort', e.target.value)} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                <option value="moi_nhat">Mới nhất</option>
                <option value="gia_tang">Giá tăng dần</option>
                <option value="gia_giam">Giá giảm dần</option>
                <option value="ban_chay">Bán chạy</option>
                <option value="danh_gia">Đánh giá cao</option>
              </select>
            </div>
          </div>

          {/* Mobile category chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-lg lg:hidden">
            <button onClick={() => setParam('category', '')} className={`whitespace-nowrap rounded-full px-4 py-2 text-label-sm font-label-sm transition-all ${!category ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>Tất cả</button>
            {categories.map(item => (
              <button key={item.id} onClick={() => setParam('category', String(item.id))} className={`whitespace-nowrap rounded-full px-4 py-2 text-label-sm font-label-sm transition-all ${category === String(item.id) ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>{item.name}</button>
            ))}
            <button onClick={() => setParam('in_stock', inStock === '1' ? '' : '1')} className={`whitespace-nowrap rounded-full px-4 py-2 text-label-sm font-label-sm transition-all ${inStock === '1' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>Còn hàng</button>
          </div>

          {loading ? (
            <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-3xl p-4 border border-outline-variant animate-pulse">
                  <div className="aspect-square rounded-2xl bg-surface-container-high mb-4" />
                  <div className="h-4 bg-surface-container-high rounded w-1/3 mb-2" />
                  <div className="h-5 bg-surface-container-high rounded w-2/3 mb-2" />
                  <div className="h-4 bg-surface-container-high rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length ? (
            <>
              <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-4">
                {products.map(product => <ProductTile key={product.ma_san_pham} product={product} />)}
              </div>
              {totalPages > 1 && (
                <div className="mt-xl flex justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setParam('page', String(i + 1))} className={`h-11 min-w-[44px] rounded-xl border text-body-md font-bold transition-all ${
                      page === i + 1 ? 'bg-primary text-on-primary border-primary organic-shadow' : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                    }`}>{i + 1}</button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-outline-variant bg-surface py-xl text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">search_off</span>
              <p className="mt-3 text-on-surface-variant font-body-lg text-body-lg">Không tìm thấy sản phẩm phù hợp.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
