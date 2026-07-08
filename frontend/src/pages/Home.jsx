import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bannerAPI, categoryAPI, productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { pickCategoryImage, pickProductImage } from '../utils/marketImages';

const formatCurrency = v => `${Number(v || 0).toLocaleString('vi-VN')}đ`;

const fallbackHeroSlides = [
  { src: '/images/raucu.webp', alt: 'Rau củ sạch' },
  { src: '/images/trai_cay.webp', alt: 'Trái cây tươi' },
  { src: '/images/ngucoc.jpg', alt: 'Ngũ cốc' },
  { src: '/images/gia_vi.jpg', alt: 'Gia vị' },
];

function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const stock = Number(product.ton_kho || 0);

  const handleAdd = async e => {
    e.preventDefault(); e.stopPropagation();
    if (!user || user.role !== 'buyer' || stock <= 0) return;
    await addToCart(product.ma_san_pham, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="bg-surface rounded-3xl p-4 border border-outline-variant organic-shadow flex flex-col group h-full">
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
        <Link to={`/products/${product.ma_san_pham}`}>
          <img
            src={pickProductImage(product)}
            alt={product.ten_san_pham}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        {stock > 0 && (
          <div className="absolute top-2 left-2 px-3 py-1 bg-secondary text-white rounded-full font-label-sm text-label-sm">Nổi bật</div>
        )}
      </div>
      <div className="flex-grow">
        <Link to={`/products/${product.ma_san_pham}`}>
          <span className="text-primary font-label-sm text-label-sm uppercase tracking-wider">{product.ten_danh_muc || 'Nông sản'}</span>
          <h4 className="text-title-md font-title-md mt-1 mb-2">{product.ten_san_pham}</h4>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-secondary font-bold text-lg">{formatCurrency(product.gia_ban)}</span>
            <span className="text-on-surface-variant/50 text-sm">/{product.don_vi}</span>
          </div>
        </Link>
      </div>
      <button
        onClick={handleAdd}
        className="w-full py-3 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 hover:bg-on-primary-fixed-variant transition-colors active:scale-95"
      >
        <span className="material-symbols-outlined text-sm">{added ? 'check' : 'shopping_cart'}</span>
        {added ? 'Đã thêm' : 'Thêm vào giỏ'}
      </button>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [heroSlides, setHeroSlides] = useState(fallbackHeroSlides);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryAPI.getAll().then(d => setCategories(d.categories || [])).catch(() => {});
    bannerAPI.getAll()
      .then(d => {
        const slides = (d.banners || []).filter(b => b.image).map(b => ({ src: b.image, alt: b.title || 'Banner' }));
        setHeroSlides(slides.length ? slides : fallbackHeroSlides);
      })
      .catch(() => {});
    productAPI.getAll('?limit=4&sort=moi_nhat')
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveSlide(c => (c + 1) % heroSlides.length), 4200);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full flex items-center overflow-hidden md:h-[500px]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10"></div>
          {heroSlides.map((slide, i) => (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              className={`absolute inset-0 w-full h-full object-cover object-right transition-all duration-1000 ${i === activeSlide ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop w-full">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm mb-6">
              Trực tiếp từ nhà vườn tới bàn ăn
            </span>
            <h1 className="font-display-lg text-display-lg text-on-surface mb-6">
              Kết nối <span className="text-primary italic">Tinh hoa</span> Nông sản Việt
            </h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant mb-10 max-w-lg">
              Trải nghiệm sự tươi ngon thuần khiết với các sản phẩm được chọn lọc kỹ lưỡng, đảm bảo tiêu chuẩn VietGAP và an toàn thực phẩm tuyệt đối.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/products')}
                className="px-8 py-4 bg-primary text-on-primary rounded-xl font-title-md text-title-md hover:bg-on-primary-fixed-variant transition-all organic-shadow active:scale-95"
              >
                Mua sắm ngay
              </button>
              <button
                onClick={() => navigate('/about')}
                className="px-8 py-4 bg-surface border border-outline text-primary rounded-xl font-title-md text-title-md hover:bg-surface-container-low transition-all active:scale-95"
              >
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </div>
        {/* Dots */}
        <div className="absolute bottom-6 right-6 flex gap-2 z-20">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`rounded-full transition-all ${i === activeSlide ? 'w-8 h-2 bg-primary' : 'w-2 h-2 bg-outline'}`}
            />
          ))}
        </div>
      </section>

      {/* Category Bento Grid */}
      <section className="py-xl max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Danh mục nổi bật</h2>
            <p className="text-on-surface-variant mt-2 font-body-md text-body-md">Khám phá thế giới nông sản phong phú</p>
          </div>
          <Link to="/products" className="text-primary font-label-sm flex items-center gap-1 group">
            Xem tất cả <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[500px]">
          <div className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden group organic-shadow cursor-pointer bg-surface-container-high">
            <img
              src={categories[0] ? pickCategoryImage(categories[0]) : '/images/raucu.webp'}
              alt="Rau củ"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <h3 className="text-white font-headline-lg text-headline-lg">Rau củ</h3>
              <p className="text-white/80 font-body-md text-body-md">Tươi sạch mỗi ngày</p>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden group organic-shadow cursor-pointer bg-surface-container-high">
            <img
              src={categories[1] ? pickCategoryImage(categories[1]) : '/images/trai_cay.webp'}
              alt="Trái cây"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <h3 className="text-white font-title-md text-title-md">Trái cây</h3>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden group organic-shadow cursor-pointer bg-surface-container-high">
            <img
              src="/images/gia_vi.jpg"
              alt="Thịt trứng"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <h3 className="text-white font-title-md text-title-md">Thịt trứng</h3>
            </div>
          </div>
          <div className="md:col-span-2 relative rounded-3xl overflow-hidden group organic-shadow cursor-pointer bg-surface-container-high">
            <img
              src="/images/ngucoc.jpg"
              alt="Gạo & Đỗ"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <h3 className="text-white font-title-md text-title-md">Gạo & Đỗ</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-xl bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-12">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Sản phẩm nổi bật</h2>
            <p className="text-on-surface-variant font-body-md text-body-md">Được yêu thích nhất trong tuần qua</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-3xl p-4 border border-outline-variant animate-pulse">
                  <div className="aspect-square rounded-2xl bg-surface-container-high mb-4" />
                  <div className="h-4 bg-surface-container-high rounded w-1/3 mb-2" />
                  <div className="h-5 bg-surface-container-high rounded w-2/3 mb-2" />
                  <div className="h-4 bg-surface-container-high rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {products.map(p => <ProductCard key={p.ma_san_pham} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-fixed-dim rounded-full blur-3xl opacity-30"></div>
            <div className="relative rounded-3xl overflow-hidden organic-shadow aspect-video">
              <img
                src="/images/farm2table-ecology.png"
                alt="Nông trại"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <h2 className="font-display-lg text-display-lg text-on-surface mb-6">Chợ Nông Sản - Vì Sức Khỏe Cộng Đồng</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant mb-8">
              Chúng tôi ra đời với sứ mệnh xóa bỏ khoảng cách giữa người nông dân và người tiêu dùng. Bằng cách ứng dụng công nghệ vào chuỗi cung ứng, Chợ Nông Sản mang đến giải pháp mua sắm tiện lợi, minh bạch và an toàn nhất.
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                </div>
                <span className="font-body-md text-body-md text-on-surface">Nguồn gốc xuất xứ rõ ràng (QR Code)</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">local_shipping</span>
                </div>
                <span className="font-body-md text-body-md text-on-surface">Giao hàng nhanh trong vòng 2 giờ</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">payments</span>
                </div>
                <span className="font-body-md text-body-md text-on-surface">Giá cả cạnh tranh, không qua trung gian</span>
              </li>
            </ul>
            <button
              onClick={() => navigate('/about')}
              className="px-8 py-4 bg-tertiary text-on-tertiary rounded-xl font-title-md text-title-md hover:opacity-90 transition-all active:scale-95"
            >
              Khám phá câu chuyện của chúng tôi
            </button>
          </div>
        </div>
      </section>

      {/* Commitment Banners */}
      <section className="bg-surface-container-low py-xl">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid md:grid-cols-3 gap-lg">
          {[
            { icon: 'verified_user', title: 'Nguồn gốc rõ ràng', desc: 'Quét mã theo dõi nguồn gốc sản phẩm.' },
            { icon: 'eco', title: 'Canh tác bền vững', desc: 'Ưu tiên nông sản an toàn và theo mùa.' },
            { icon: 'local_shipping', title: 'Giao hàng nhanh', desc: 'Miễn phí ship cho đơn hàng từ 500k.' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-4 bg-surface p-6 rounded-2xl organic-shadow border border-outline-variant/30">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              </div>
              <div>
                <h4 className="text-on-surface font-semibold text-title-md">{item.title}</h4>
                <p className="text-on-surface-variant font-body-md text-body-md mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chat widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        <button className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-3xl">chat</span>
        </button>
      </div>
    </div>
  );
}
