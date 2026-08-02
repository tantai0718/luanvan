import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { categoryAPI, productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { pickCategoryImage, pickProductImage } from '../utils/marketImages';
import { getExpiryDiscountPrice, getExpiryDiscountPercent } from '../utils/expiryDiscount';
import { ShoppingCart, Check, Ban, SearchX, SlidersHorizontal, Tag, PackageCheck, Leaf, Search } from 'lucide-react';

const formatCurrency = v => `${Number(v || 0).toLocaleString('vi-VN')}đ`;

function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const stock = Number(product.ton_kho || 0);
  const navigate = useNavigate();

  const handleAdd = async e => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return navigate('/login');
    if (user.role !== 'buyer') return alert('Chỉ tài khoản người mua mới có thể thêm vào giỏ hàng.');
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
    <Link
      to={`/products/${product.ma_san_pham}`}
      className="group flex flex-col bg-card rounded-card border border-border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-square overflow-hidden bg-background">
        <img
          src={pickProductImage(product)}
          alt={product.ten_san_pham}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-card/90 text-text-primary px-5 py-2 rounded-full text-caption font-semibold flex items-center gap-2">
              <Ban size={14} /> Hết hàng
            </span>
          </div>
        )}
        {stock > 0 && product.ten_danh_muc && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-text-primary text-caption font-medium px-3 py-1.5 rounded-full shadow-sm">
              <Leaf size={12} className="text-primary" />
              {product.ten_danh_muc}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 gap-3">
        <h3 className="text-h4 text-text-primary line-clamp-2 leading-snug min-h-[54px]">
          {product.ten_san_pham}
        </h3>

        <div className="flex items-baseline gap-1.5 mt-auto flex-wrap">
          {(() => {
            const discounted = getExpiryDiscountPrice(product);
            if (discounted != null) {
              return (
                <>
                  <span className="text-[20px] font-bold text-primary leading-none">{formatCurrency(discounted)}</span>
                  <span className="text-text-secondary/40 text-sm line-through">{formatCurrency(product.gia_ban)}</span>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full">-{getExpiryDiscountPercent(product)}%</span>
                </>
              );
            }
            return <span className="text-[20px] font-bold text-primary leading-none">{formatCurrency(product.gia_ban)}</span>;
          })()}
          <span className="text-text-secondary text-caption">/{product.don_vi}</span>
        </div>

        <button
          onClick={handleAdd}
          disabled={stock <= 0}
          className={`w-full flex items-center justify-center gap-2 rounded-btn py-2.5 text-body font-semibold transition-all duration-200 active:scale-[0.97] ${
            stock <= 0
              ? 'bg-background text-text-secondary/60 cursor-not-allowed border border-border'
              : added
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md'
          }`}
        >
          {stock <= 0 ? (
            <><Ban size={16} /> Hết hàng</>
          ) : added ? (
            <><Check size={16} /> Đã thêm vào giỏ</>
          ) : (
            <><ShoppingCart size={16} /> Thêm vào giỏ</>
          )}
        </button>
      </div>
    </Link>
  );
}

function Skeleton() {
  return (
    <div className="bg-card rounded-card border border-border overflow-hidden animate-pulse">
      <div className="aspect-square bg-background" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-background rounded-full w-1/3" />
        <div className="h-4 bg-background rounded-full w-3/4" />
        <div className="h-4 bg-background rounded-full w-1/2" />
        <div className="h-10 bg-background rounded-btn w-full mt-2" />
      </div>
    </div>
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
    categoryAPI.getAll()
      .then(data => {
        const list = data.categories || data || [];
        setCategories(list.filter(c => c.loai === 'san_pham'));
      })
      .catch(() => setCategories([]));
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
  const activeCategory = categories.find(c => String(c.id) === String(category));

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-8">
          <nav className="flex items-center gap-2 text-caption text-text-secondary mb-4">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Sản phẩm</span>
          </nav>
          <h1 className="text-h1 text-text-primary">
            {q ? `Kết quả cho "${q}"` : activeCategory?.name || 'Tất cả sản phẩm'}
          </h1>
          <p className="text-body text-text-secondary mt-2">
            {loading ? 'Đang tải...' : `Hiển thị ${total} sản phẩm`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6">
            {/* Categories */}
            <div className="bg-card rounded-card border border-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={18} className="text-primary" />
                <h2 className="text-h4 text-text-primary">Danh mục</h2>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setParam('category', '')}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-btn text-body transition-all duration-200 ${
                    !category
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-text-secondary hover:bg-background hover:text-text-primary'
                  }`}
                >
                  <PackageCheck size={16} />
                  Tất cả sản phẩm
                  {!category && <span className="ml-auto text-caption font-normal text-primary/70">{total}</span>}
                </button>
                {categories.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setParam('category', String(item.id))}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-btn text-body transition-all duration-200 ${
                      category === String(item.id)
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text-secondary hover:bg-background hover:text-text-primary'
                    }`}
                  >
                    <Tag size={14} />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock filter */}
            <div className="bg-card rounded-card border border-border p-5 shadow-card">
              <h2 className="text-h4 text-text-primary mb-3">Tình trạng</h2>
              <button
                onClick={() => setParam('in_stock', inStock === '1' ? '' : '1')}
                className={`w-full flex items-center gap-2 rounded-btn border px-4 py-2.5 text-body font-medium transition-all duration-200 ${
                  inStock === '1'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'border-border text-text-secondary hover:bg-background'
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  inStock === '1' ? 'bg-primary border-primary' : 'border-text-secondary/30'
                }`}>
                  {inStock === '1' && <Check size={10} className="text-white" />}
                </div>
                Chỉ hiện còn hàng
              </button>
            </div>

            {/* Promo banner */}
            <div className="relative rounded-card overflow-hidden shadow-card hidden lg:block aspect-[3/4]">
              <img
                src={activeCategory ? pickCategoryImage(activeCategory) : '/images/raucu.webp'}
                alt="Ưu đãi"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                <p className="text-white/70 text-caption font-medium uppercase tracking-wider">Ưu đãi tuần này</p>
                <h3 className="text-h3 text-white mt-1 leading-snug">Giảm 20% nông sản theo mùa</h3>
                <button
                  onClick={() => setParam('in_stock', '1')}
                  className="mt-4 w-fit bg-white text-primary px-5 py-2.5 rounded-btn text-body font-semibold hover:bg-white/90 transition-all active:scale-95 shadow-lg"
                >
                  Xem ngay
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <section className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:flex-none">
                  <input
                    value={q}
                    onChange={e => setParam('q', e.target.value)}
                    placeholder="Tìm nông sản..."
                    className="input-field w-full sm:w-56 pl-10"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                </div>
                <select
                  value={sort}
                  onChange={e => setParam('sort', e.target.value)}
                  className="select-field w-auto"
                >
                  <option value="moi_nhat">Mới nhất</option>
                  <option value="gia_tang">Giá tăng dần</option>
                  <option value="gia_giam">Giá giảm dần</option>
                  <option value="ban_chay">Bán chạy</option>
                  <option value="danh_gia">Đánh giá cao</option>
                </select>
              </div>

              {/* Mobile category chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden scrollbar-hide">
                <button
                  onClick={() => setParam('category', '')}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-caption font-medium transition-all ${
                    !category ? 'bg-primary text-white shadow-sm' : 'bg-card border border-border text-text-secondary hover:bg-background'
                  }`}
                >
                  Tất cả
                </button>
                {categories.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setParam('category', String(item.id))}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-caption font-medium transition-all ${
                      category === String(item.id) ? 'bg-primary text-white shadow-sm' : 'bg-card border border-border text-text-secondary hover:bg-background'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
                <button
                  onClick={() => setParam('in_stock', inStock === '1' ? '' : '1')}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-caption font-medium transition-all ${
                    inStock === '1' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-card border border-border text-text-secondary hover:bg-background'
                  }`}
                >
                  Còn hàng
                </button>
              </div>
            </div>

            {/* Product grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
              </div>
            ) : products.length ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {products.map(p => <ProductCard key={p.ma_san_pham} product={p} />)}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setParam('page', String(i + 1))}
                        className={`h-10 min-w-[40px] rounded-btn text-body font-semibold transition-all duration-200 ${
                          page === i + 1
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-card border border-border text-text-secondary hover:bg-background hover:border-primary/30'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-card border border-dashed border-border bg-card py-16 text-center">
                <SearchX size={48} className="mx-auto text-text-secondary/30" strokeWidth={1.5} />
                <p className="mt-4 text-body text-text-secondary">Không tìm thấy sản phẩm phù hợp.</p>
                <button
                  onClick={() => { setSearchParams({}); }}
                  className="mt-4 btn-outline text-body"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
