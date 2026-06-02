import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categoryAPI, productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const placeholderImage = 'https://placehold.co/600x760/edf3ee/0f5238?text=Farm2Table';
const heroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCpKqCds0V0p9eOQLlKBtzEb9nwKWAkRQhupzixmGjwfkphXEDaQrwTEHUl4wvWX32nEDFILK_94oyjM4kv7qU4szPTfCxRm3jkYrA09mtkRRsxbusjm875LZSOVXHbrc-UMJvdbcgO4bbtqzjUs1u3ssBnslNa02KIAYcRnZVI-NPN1AWgZbRIITt3sOukKbfZ2EAn5ObI5y-k42C0xNLy3Cyj1RtAf3KsuBuhRMA_f5q-KNWKhCUiD5KlitBU1PypuRctIFOiKfk';
const farmerImage = '/images/farm2table-ecology.png';
const heroSlides = [
  { src: heroImage, alt: 'Nong san tuoi tren ban go' },
  { src: '/images/raucu.webp', alt: 'Rau cu sach nhieu mau sac' },
  { src: '/images/trai_cay.webp', alt: 'Trai cay tuoi ngon' },
  { src: '/images/ngucoc.jpg', alt: 'Ngu coc va cac loai hat' },
  { src: '/images/gia_vi.jpg', alt: 'Gia vi va thao moc' },
];
const featuredCategorySlugs = ['rau-cu', 'trai-cay', 'ngu-coc', 'gia-vi'];
const categoryImages = {
  'rau-cu': '/images/raucu.webp',
  'trai-cay': '/images/trai_cay.webp',
  'ngu-coc': '/images/ngucoc.jpg',
  'gia-vi': '/images/gia_vi.jpg',
};

function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const stock = Number(product.ton_kho || 0);

  const handleAdd = async event => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) return;
    if (user.role !== 'buyer' || stock <= 0) return;
    await addToCart(product.ma_san_pham, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Link to={`/products/${product.ma_san_pham}`} className="group min-w-[260px] overflow-hidden rounded-2xl border border-[#d7ddd8] bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg md:min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#efeded]">
        <img src={product.images?.[0] || placeholderImage} alt={product.ten_san_pham} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {stock > 0 ? <span className="absolute left-4 top-4 rounded-full bg-[#a33d23] px-3 py-1 text-xs font-semibold text-white">Tươi mới</span> : null}
      </div>
      <div className="p-5">
        <p className="text-xs text-[#404943]">{product.ten_danh_muc || product.ten_nong_trai || 'Nông sản'}</p>
        <h3 className="mt-2 line-clamp-2 min-h-[48px] text-sm font-semibold leading-6">{product.ten_san_pham}</h3>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-[#0f5238]">{formatCurrency(product.gia_ban)}</p>
            <p className="text-xs text-[#404943]">/ {product.don_vi}</p>
          </div>
          <button onClick={handleAdd} aria-label={`Thêm ${product.ten_san_pham} vào giỏ`} className={`flex h-10 w-10 items-center justify-center rounded-full ${added ? 'bg-[#b1f0ce] text-[#0f5238]' : 'bg-[#b1f0ce] text-[#0f5238] hover:bg-[#0f5238] hover:text-white'}`}>
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const featuredCategories = featuredCategorySlugs
    .map(slug => categories.find(category => category.slug === slug))
    .filter(Boolean);

  useEffect(() => {
    categoryAPI.getAll().then(data => setCategories(data.categories || [])).catch(() => setCategories([]));
    productAPI
      .getAll('?limit=4&sort=moi_nhat')
      .then(data => setProducts(data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide(current => (current + 1) % heroSlides.length);
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="market-shell">
      <section className="relative flex min-h-[520px] items-end overflow-hidden md:min-h-[600px] md:items-center">
        {heroSlides.map((slide, index) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-out ${
              index === activeHeroSlide ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,25,18,.82),rgba(10,25,18,.36),rgba(10,25,18,.18))]" />
        <div className="market-page relative py-12 text-white">
          <p className="inline-flex rounded-full bg-[#2d6a4f] px-4 py-2 text-xs font-bold uppercase">Tươi ngon mỗi ngày</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">Nông sản sạch từ tâm</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/90 md:text-lg">
            Kết nối trực tiếp bàn ăn gia đình với nguồn hàng tận tụy, an toàn và minh bạch.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => navigate('/products')} className="rounded-xl bg-[#0f5238] px-7 py-4 text-sm font-semibold text-white shadow-lg">Mua sắm ngay</button>
            <button onClick={() => navigate('/about')} className="rounded-xl border border-white/40 bg-white/15 px-7 py-4 text-sm font-semibold text-white backdrop-blur">Tìm hiểu thêm</button>
          </div>
          <div className="mt-8 flex gap-2" aria-label="Ảnh banner">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.src}
                onClick={() => setActiveHeroSlide(index)}
                aria-label={`Chuyển đến ảnh banner ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeHeroSlide ? 'w-9 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="market-page py-14 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Danh mục nổi bật</h2>
            <p className="mt-2 text-sm text-[#404943]">Khám phá nguồn dinh dưỡng từ thiên nhiên.</p>
          </div>
          <Link to="/products" className="stitch-link text-sm">Xem tất cả</Link>
        </div>
        <div className="grid auto-rows-[180px] gap-5 md:grid-cols-4 md:grid-rows-2 md:auto-rows-auto md:h-[500px]">
          {featuredCategories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => navigate(`/products?category=${category.id}`)}
              className={`group relative overflow-hidden rounded-2xl text-left ${index === 0 ? 'md:col-span-2 md:row-span-2' : index === 1 ? 'md:col-span-2' : ''}`}
            >
              <img src={categoryImages[category.slug]} alt={category.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#0f5238]/90 via-[#0f5238]/15 to-transparent" />
              <span className="absolute bottom-0 left-0 p-5 text-white">
                <strong className="block text-lg font-bold">{category.name}</strong>
                <small className="mt-1 block text-white/80">{category.icon || 'Farm2Table'} Nguồn hàng chọn lọc</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-[#f5f3f3] py-14 md:py-20">
        <div className="market-page">
          <div className="mb-8 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#a33d23]">bolt</span>
            <h2 className="text-3xl font-bold">Ưu đãi hôm nay</h2>
          </div>
          {loading ? (
            <div className="grid gap-5 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[460px] animate-pulse rounded-2xl bg-white" />)}</div>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-3 md:grid md:grid-cols-4 md:overflow-visible">
              {products.map(product => <ProductCard key={product.ma_san_pham} product={product} />)}
            </div>
          )}
        </div>
      </section>

      <section className="market-page grid gap-8 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="relative max-w-xl">
          <div className="absolute -left-6 -top-6 h-44 w-44 rounded-full bg-[#e4e2e2]" />
          <img src={farmerImage} alt="Nông dân Farm2Table" className="relative aspect-[5/4] w-full rounded-[24px] object-cover shadow-lg" />
        </div>
        <div>
          <p className="stitch-kicker">Về những người bạn</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight">Câu chuyện từ những bàn tay cần mẫn</h2>
          <p className="mt-5 text-base leading-8 text-[#404943]">
            Mỗi sản phẩm bắt đầu từ nông trại thật, quy trình thật và mong muốn đưa thực phẩm sạch đến gần hơn với gia đình Việt.
          </p>
          <div className="mt-6 grid gap-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined rounded-lg bg-[#b1f0ce] p-2 text-[#0f5238]">qr_code_2</span>
              <p className="text-sm leading-6 text-[#404943]"><strong className="block text-[#1b1c1c]">Minh bạch 100%</strong>Quét mã và theo dõi nguồn gốc sản phẩm.</p>
            </div>
            <div className="flex gap-3">
              <span className="material-symbols-outlined rounded-lg bg-[#ffdad2] p-2 text-[#a33d23]">eco</span>
              <p className="text-sm leading-6 text-[#404943]"><strong className="block text-[#1b1c1c]">Canh tác bền vững</strong>Ưu tiên nông sản an toàn và theo mùa.</p>
            </div>
          </div>
          <Link to="/about" className="mt-7 inline-flex rounded-lg border border-[#0f5238] px-5 py-3 text-sm font-semibold text-[#0f5238]">Gặp gỡ Farm2Table</Link>
        </div>
      </section>

      <section className="bg-[#e7eeea] py-14">
        <div className="market-page text-center">
          <span className="material-symbols-outlined text-[#0f5238]">mail</span>
          <h2 className="mt-4 text-3xl font-bold">Nhận thông tin nông sản sạch</h2>
          <p className="mt-2 text-sm text-[#404943]">Theo dõi mùa vụ và ưu đãi giao hàng mới nhất.</p>
          <div className="mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input className="market-field flex-1 px-4 py-3 text-sm" placeholder="Địa chỉ email của bạn" />
            <button className="rounded-lg bg-[#0f5238] px-6 py-3 text-sm font-semibold text-white">Đăng ký ngay</button>
          </div>
        </div>
      </section>
    </div>
  );
}
