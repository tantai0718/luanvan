import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { orderAPI, productAPI, reviewAPI, subscriptionAPI, promotionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { pickProductImage } from '../utils/marketImages';
import { Check, ShieldCheck, ChevronRight, ChevronLeft, Play, Minus, Plus, X, Eye, Tag, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const isVideoUrl = url => /\.(mp4|webm|mov)$/i.test(url || '');
const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

function tinhSoNgaySuDung(hanSuDung) {
  if (!hanSuDung) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(hanSuDung);
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endDay - today) / (1000 * 60 * 60 * 24));
}

function calculateExpiryDiscount(product, quantity = 1) {
  if (!product || !product.han_su_dung || Number(product.phan_tram_giam_can_han || 0) <= 0 || Number(product.so_ngay_can_han || 0) < 0) return 0;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(product.han_su_dung);
  const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const daysLeft = Math.round((expiryDay - today) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0 || daysLeft > Number(product.so_ngay_can_han)) return 0;
  return Math.round(Number(product.gia_ban || 0) * Number(quantity || 0) * Number(product.phan_tram_giam_can_han || 0) / 100);
}

function formatPromoTitle(ten_km, phan_tram_giam, loai_uu_dai) {
  if (!ten_km) return '';
  if (loai_uu_dai === 'giam_theo_so_luong' && phan_tram_giam != null) {
    const pct = Number(phan_tram_giam);
    if (pct > 0) {
      if (/Giảm\s+\d+(?:\.\d+)?%/i.test(ten_km)) {
        return ten_km.replace(/Giảm\s+\d+(?:\.\d+)?%/i, `Giảm ${pct}%`);
      } else if (/\d+(?:\.\d+)?%/.test(ten_km)) {
        return ten_km.replace(/\d+(?:\.\d+)?%/, `${pct}%`);
      }
    }
  }
  return ten_km;
}

function calcPromotions(promos, totalAmount, quantity, loaiDon) {
  let tienGiam = 0;
  let mienPhiShip = false;
  const appliedList = [];

  for (const promo of promos || []) {
    if (!promo.trang_thai) continue;
    const apDung = promo.ap_dung_cho;
    const isMatchOrder =
      apDung === 'tat_ca' ||
      (apDung === 'thuong_va_dat_truoc' && ['thuong', 'dat_truoc', 'thuong_va_dat_truoc'].includes(loaiDon)) ||
      (apDung === 'dinh_ky' && loaiDon === 'dinh_ky');

    if (!isMatchOrder) continue;

    const minVal = Number(promo.dieu_kien_toi_thieu || 0);

    if (promo.loai_uu_dai === 'giam_theo_so_luong') {
      if (quantity >= minVal) {
        const pct = Number(promo.phan_tram_giam || 0);
        let discount = Math.round(totalAmount * (pct / 100));
        if (promo.gia_tri_giam_toi_da && Number(promo.gia_tri_giam_toi_da) > 0) {
          discount = Math.min(discount, Number(promo.gia_tri_giam_toi_da));
        }
        tienGiam += discount;
        const title = formatPromoTitle(promo.ten_km, pct, promo.loai_uu_dai);
        appliedList.push({
          name: title,
          amount: discount,
          label: `${title} (-${Number(discount).toLocaleString('vi-VN')}đ)`,
        });
      }
    } else if (promo.loai_uu_dai === 'mien_phi_ship') {
      if ((totalAmount - tienGiam) >= minVal) {
        mienPhiShip = true;
      }
    }
  }

  return { tienGiam, mienPhiShip, appliedList };
}

function ReviewItem({ review }) {
  const stars = Math.max(0, Math.min(5, Number(review.so_sao || 0)));
  return (
    <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-h3 text-text-primary">{review.ten_nguoi_mua || 'Khách hàng'}</p>
        <span className="text-sm text-text-secondary">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
      </div>
      <p className="mt-1 text-[12px] font-medium text-text-secondary">{review.ngay_tao ? new Date(review.ngay_tao).toLocaleDateString('vi-VN') : ''}</p>
      <p className="mt-3 text-body text-text-secondary leading-relaxed">{review.noi_dung || 'Không có nhận xét thêm.'}</p>

      {review.phan_hoi && (
        <div className="mt-3 rounded-xl bg-primary-light/30 p-3">
          <p className="text-[12px] font-bold text-primary">Phản hồi từ cửa hàng</p>
          <p className="mt-1 text-body text-text-primary">{review.phan_hoi}</p>
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, showToast } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [mobileGalleryOpen, setMobileGalleryOpen] = useState(false);

  const [reviewForm, setReviewForm] = useState({ so_sao: 5, noi_dung: '' });
  const [reviewMessage, setReviewMessage] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const [preorderForm, setPreorderForm] = useState({ quantity: 1, ngay_giao_du_kien: '', dia_chi_giao: user?.address || '', ghi_chu: '', phuong_thuc_tt: 'banking', loai_tien_coc: '30' });
  const [preorderMessage, setPreorderMessage] = useState('');
  const [savingPreorder, setSavingPreorder] = useState(false);

  const [subscriptionForm, setSubscriptionForm] = useState({ quantity: 1, tan_suat_giao: 'hang_tuan', so_ky_giao: 4, ngay_bat_dau: '', dia_chi_giao: user?.address || '', ghi_chu: '', phuong_thuc_tt: 'banking', loai_tien_coc: '30' });
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [savingSubscription, setSavingSubscription] = useState(false);

  const [preorderPromoCode, setPreorderPromoCode] = useState('');
  const [preorderPromoInput, setPreorderPromoInput] = useState('');
  const [preorderPromoResult, setPreorderPromoResult] = useState(null);
  const [preorderPromoLoading, setPreorderPromoLoading] = useState(false);

  const [subPromoCode, setSubPromoCode] = useState('');
  const [subPromoInput, setSubPromoInput] = useState('');
  const [subPromoResult, setSubPromoResult] = useState(null);
  const [subPromoLoading, setSubPromoLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([productAPI.getById(id), reviewAPI.getByProduct(id), promotionAPI.getActive().catch(() => ({ promotions: [] }))])
      .then(([productData, reviewData, promoData]) => {
        const next = productData.product;
        setProduct(next);
        setReviews(reviewData.reviews || []);
        setPromotions(promoData.promotions || []);
        const BACKEND = 'http://localhost:5000';
        const firstImage = next?.images?.[0];
        const initialImage = firstImage ? (firstImage.startsWith('/upload/') ? `${BACKEND}${firstImage}` : firstImage) : pickProductImage(next);
        setActiveImage(initialImage);
      })
      .catch(err => setError(err.message || 'Không tải được thông tin sản phẩm.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product?.ma_danh_muc) return;
    productAPI.getAll(`?category=${product.ma_danh_muc}&limit=4`)
      .then(data => setRelatedProducts((data.products || []).filter(item => item.ma_san_pham !== product.ma_san_pham).slice(0, 3)))
      .catch(() => setRelatedProducts([]));
  }, [product]);

  useEffect(() => {
    setPreorderForm(prev => ({ ...prev, dia_chi_giao: user?.address || prev.dia_chi_giao }));
    setSubscriptionForm(prev => ({ ...prev, dia_chi_giao: user?.address || prev.dia_chi_giao }));
  }, [user]);

  const handleApplyPreorderCode = async (code) => {
    if (!code || !code.trim()) return;
    setPreorderPromoLoading(true);
    const subtotal = (product?.gia_ban || 0) * preorderForm.quantity;
    try {
      const res = await promotionAPI.validateCode({ ma_code: code.trim(), tong_tien: subtotal, so_luong: preorderForm.quantity, loai_don: 'dat_truoc' });
      setPreorderPromoCode(code.trim());
      setPreorderPromoResult({ ...res, error: null });
    } catch (err) {
      setPreorderPromoCode(code.trim());
      setPreorderPromoResult({ tien_giam: 0, error: err.message });
    } finally { setPreorderPromoLoading(false); }
  };

  const handleApplySubCode = async (code) => {
    if (!code || !code.trim()) return;
    setSubPromoLoading(true);
    const subtotal = (product?.gia_ban || 0) * subscriptionForm.quantity;
    try {
      const res = await promotionAPI.validateCode({ ma_code: code.trim(), tong_tien: subtotal, so_luong: subscriptionForm.quantity, loai_don: 'dinh_ky' });
      setSubPromoCode(code.trim());
      setSubPromoResult({ ...res, error: null });
    } catch (err) {
      setSubPromoCode(code.trim());
      setSubPromoResult({ tien_giam: 0, error: err.message });
    } finally { setSubPromoLoading(false); }
  };

  useEffect(() => {
    if (preorderPromoCode) handleApplyPreorderCode(preorderPromoCode);
  }, [preorderForm.quantity]);

  useEffect(() => {
    if (subPromoCode) handleApplySubCode(subPromoCode);
  }, [subscriptionForm.quantity]);

  const images = useMemo(() => {
    if (!product) return [];
    const BACKEND = 'http://localhost:5000';
    const list = (product.images || []).map(img => img.startsWith('/upload/') ? `${BACKEND}${img}` : img);
    return list.length ? list : [pickProductImage(product)];
  }, [product]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="bg-card rounded-3xl p-xl text-center max-w-lg w-full border border-border shadow-card">
          <p className="text-h3 text-text-primary">{error || 'Không tìm thấy sản phẩm.'}</p>
          <Link to="/products" className="mt-4 inline-flex bg-primary text-white px-5 py-2.5 rounded-xl font-bold">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  const stock = Number(product.ton_kho || 0);
  const maxQuantity = Math.max(1, stock || 1);

  const expiryDiscount = calculateExpiryDiscount(product, 1);
  const expiryDiscountPercent = Number(product?.phan_tram_giam_can_han || 0);
  const expiryPrice = expiryDiscount > 0 ? Math.round(Number(product.gia_ban || 0) * (100 - expiryDiscountPercent) / 100) : null;

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'buyer') {
      alert('Chỉ tài khoản người mua mới có thể thêm vào giỏ hàng.');
      return;
    }
    if (stock <= 0) return;
    const res = await addToCart(product.ma_san_pham, quantity);
    if (res?.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    }
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'buyer') {
      alert('Chỉ tài khoản người mua mới có thể mua hàng.');
      return;
    }
    if (stock <= 0) return;
    const res = await addToCart(product.ma_san_pham, quantity);
    if (res?.success) {
      navigate('/cart');
    }
  };

  const handleReviewSubmit = async event => {
    event.preventDefault();
    if (!user || user.role !== 'buyer') return navigate('/login');
    setSavingReview(true); setReviewMessage('');
    try {
      await reviewAPI.create({ ma_san_pham: product.ma_san_pham, ma_don_hang: null, so_sao: reviewForm.so_sao, noi_dung: reviewForm.noi_dung });
      const reviewData = await reviewAPI.getByProduct(id);
      setReviews(reviewData.reviews || []);
      setReviewForm({ so_sao: 5, noi_dung: '' });
      setReviewMessage('Đánh giá của bạn đã được ghi nhận.');
    } catch (err) { setReviewMessage(err.message || 'Không thể gửi đánh giá.'); }
    finally { setSavingReview(false); }
  };

  const handlePreorder = async event => {
    event.preventDefault();
    if (!user) return navigate('/login');
    setSavingPreorder(true); setPreorderMessage('');
    try {
      const data = await orderAPI.createPreorder({ product_id: product.ma_san_pham, quantity: preorderForm.quantity, dia_chi_giao: preorderForm.dia_chi_giao, ghi_chu: preorderForm.ghi_chu, phuong_thuc_tt: preorderForm.phuong_thuc_tt, ngay_giao_du_kien: preorderForm.ngay_giao_du_kien, loai_tien_coc: preorderForm.phuong_thuc_tt === 'banking' ? preorderForm.loai_tien_coc : null, ma_code: preorderPromoCode });
      navigate(`/orders/${data.order.id}?success=1`);
    } catch (err) { setPreorderMessage(err.message || 'Không thể tạo đơn đặt trước.'); }
    finally { setSavingPreorder(false); }
  };

  const handleSubscription = async event => {
    event.preventDefault();
    if (!user) return navigate('/login');
    setSavingSubscription(true); setSubscriptionMessage('');
    try {
      const data = await subscriptionAPI.create({ product_id: product.ma_san_pham, quantity: subscriptionForm.quantity, dia_chi_giao: subscriptionForm.dia_chi_giao, ghi_chu: subscriptionForm.ghi_chu, phuong_thuc_tt: subscriptionForm.phuong_thuc_tt, ngay_bat_dau: subscriptionForm.ngay_bat_dau, tan_suat_giao: subscriptionForm.tan_suat_giao, so_ky_giao: subscriptionForm.so_ky_giao, loai_tien_coc: subscriptionForm.phuong_thuc_tt === 'banking' ? subscriptionForm.loai_tien_coc : null, ma_code: subPromoCode });
      if (data.order_id) {
        navigate(`/orders/${data.order_id}?success=1`);
      } else {
        setSubscriptionMessage('Đăng ký giao định kỳ thành công.');
      }
    } catch (err) { setSubscriptionMessage(err.message || 'Không thể tạo đăng ký giao định kỳ.'); }
    finally { setSavingSubscription(false); }
  };

  return (
    <div className="bg-background min-h-screen py-xl">
      {/* Mobile Gallery Overlay */}
      {mobileGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setMobileGalleryOpen(false)}>
          <div className="relative max-w-full max-h-full p-4" onClick={e => e.stopPropagation()}>
            {isVideoUrl(activeImage) ? (
              <video src={activeImage} controls className="max-h-[80vh] rounded-2xl" />
            ) : (
              <img src={activeImage} alt={product.ten_san_pham} className="max-h-[80vh] rounded-2xl object-contain" />
            )}
            <div className="flex justify-center gap-2 mt-4">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(img)} className={`w-14 h-14 rounded-xl overflow-hidden border-2 ${activeImage === img ? 'border-primary' : 'border-white/30'}`}>
                  {isVideoUrl(img) ? (
                    <div className="w-full h-full bg-card flex items-center justify-center"><Play size={20} className="text-white" /></div>
                  ) : (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
            <button className="absolute top-4 right-4 text-white" onClick={() => setMobileGalleryOpen(false)}><X size={32} /></button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop space-y-xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-body text-text-secondary">
          <Link to="/" className="hover:text-primary">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/products" className="hover:text-primary">Sản phẩm</Link>
          <ChevronRight size={14} />
          <span className="text-text-primary">{product.ten_san_pham}</span>
        </nav>

        {/* Product Main Section */}
        <section className="grid gap-8 lg:gap-12 lg:grid-cols-12 items-start">
          {/* Gallery - Đổi từ col-span-7 thành col-span-6 */}
          <div className="lg:col-span-6">
            <div className="lg:sticky lg:top-28 space-y-4">
              <div
                className="rounded-3xl overflow-hidden bg-background cursor-pointer shadow-card aspect-square"
                onClick={() => setMobileGalleryOpen(true)}
              >
                {isVideoUrl(activeImage) ? (
                  <video src={activeImage} controls className="w-full h-full object-cover" onClick={e => e.stopPropagation()} />
                ) : (
                  <img src={activeImage} alt={product.ten_san_pham} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                )}
              </div>
              <div className="grid grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(img)} className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-primary shadow-card' : 'border-transparent hover:border-border'
                    }`}>
                    {isVideoUrl(img) ? (
                      <div className="w-full h-full bg-card flex items-center justify-center relative">
                        <img src="/images/ngucoc.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        <Play size={20} className="text-text-primary relative z-10" />
                      </div>
                    ) : (
                      <img src={img} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info - Đổi từ col-span-5 thành col-span-6 */}
          <aside className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-primary text-caption">
              <ShieldCheck size={14} />
              Nguồn hàng chọn lọc
            </div>
            <h1 className="text-h1 text-text-primary mt-3 mb-3">{product.ten_san_pham}</h1>
            <div className="flex items-center gap-3 text-body text-text-secondary mb-lg">
              <span className="text-text-secondary font-bold">★ {Number(product.diem_danh_gia || 0).toFixed(1)}</span>
              <span>({product.tong_danh_gia || reviews.length} đánh giá)</span>
              <span className="rounded-full bg-secondary-container text-on-secondary-container px-3 py-0.5">{product.ten_danh_muc || 'Nông sản'}</span>
            </div>

            {/* Price */}
            <div className="bg-background rounded-3xl p-5 mb-lg">
              <div className="flex items-baseline gap-2 flex-wrap">
                {expiryPrice ? (
                  <>
                    <span className="text-h1 text-rose-600 font-bold">{formatCurrency(expiryPrice)}</span>
                    <span className="text-body text-text-secondary line-through">{formatCurrency(product.gia_ban)}</span>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                      Ưu đãi trong ngày - Giảm {expiryDiscountPercent}%
                    </span>
                  </>
                ) : (
                  <span className="text-h1 text-text-secondary">{formatCurrency(product.gia_ban)}</span>
                )}
                <span className="text-body text-text-secondary">/ {product.don_vi}</span>
              </div>
              <p className="mt-1 text-[12px] font-medium text-text-secondary">Giá đã bao gồm VAT nếu có.</p>
            </div>

            {/* Meta */}
            <div className="space-y-3 py-lg border-y border-border text-body text-text-secondary mb-lg">
              <div className="flex justify-between"><span>Nguồn hàng</span><strong className="text-text-primary">{product.ten_nong_trai || 'Farm2Table'}</strong></div>
              <div className="flex justify-between"><span>Khu vực</span><strong className="text-text-primary">{product.tinh_thanh || 'Toàn quốc'}</strong></div>
              <div className="flex justify-between"><span>Tồn kho</span><strong className="text-text-primary">{stock > 0 ? `${stock} ${product.don_vi}` : 'Tạm hết'}</strong></div>
              {(product.han_su_dung) && (() => {
                const soNgaySuDung = tinhSoNgaySuDung(product.han_su_dung);
                return (
                  <div className="flex justify-between">
                    <span>Hạn sử dụng</span>
                    <strong className={
                      product.trang_thai_hsd === 'het_han' ? 'text-rose-600' :
                      product.trang_thai_hsd === 'can_han' ? 'text-amber-600' :
                      'text-text-primary'
                    }>
                      {soNgaySuDung === null ? new Date(product.han_su_dung).toLocaleDateString('vi-VN') :
                        product.trang_thai_hsd === 'het_han' ? 'Đã hết hạn' :
                        product.trang_thai_hsd === 'can_han' ? ` ${soNgaySuDung} ngày` :
                        ` ${soNgaySuDung} ngày`}
                    </strong>
                  </div>
                );
              })()}
            </div>

            {/* Quantity */}
            <div className="mb-lg">
              <span className="text-body text-text-primary block mb-3">Số lượng</span>
              <div className="flex items-center gap-4">
                <div className="flex h-12 overflow-hidden rounded-2xl border border-border bg-card">
                  <button onClick={() => setQuantity(p => Math.max(1, Number(p) - 1))} className="flex w-12 items-center justify-center hover:bg-background transition-all text-text-primary"><Minus size={16} /></button>
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={quantity}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setQuantity('');
                        return;
                      }
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) {
                        if (stock > 0 && num > stock) {
                          setQuantity(stock);
                          showToast(`Chỉ còn ${stock} ${product?.don_vi || 'sản phẩm'} trong kho`, 'warning');
                        } else {
                          setQuantity(Math.max(1, num));
                        }
                      }
                    }}
                    onBlur={() => {
                      if (!quantity || Number(quantity) < 1) setQuantity(1);
                    }}
                    className="w-16 text-center font-bold text-h3 text-text-primary bg-transparent outline-none border-x border-border focus:bg-background/80 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button onClick={() => setQuantity(p => {
                    const next = Number(p || 0) + 1;
                    if (stock > 0 && next > stock) {
                      showToast(`Chỉ còn ${stock} ${product?.don_vi || 'sản phẩm'} trong kho`, 'warning');
                      return stock;
                    }
                    return next;
                  })} className="flex w-12 items-center justify-center hover:bg-background transition-all text-text-primary"><Plus size={16} /></button>
                </div>
                <span className="text-body text-text-secondary">Còn {stock} trong kho</span>
              </div>
            </div>

            {/* Description */}
            {product.mo_ta && (
              <div className="bg-background rounded-2xl px-5 py-4 mb-lg">
                <p className="text-[12px] font-medium text-primary uppercase tracking-widest mb-2">Mô tả sản phẩm</p>
                <p className="text-body text-text-secondary leading-relaxed">{product.mo_ta}</p>
              </div>
            )}

            {/* Actions */}
            {user?.role === 'admin' ? (
              <div className="bg-background rounded-2xl px-5 py-3 text-body text-text-secondary">Tài khoản quản trị không dùng để mua hàng.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={handleAddToCart} disabled={stock <= 0} className={`rounded-2xl px-5 py-4 text-h3 transition-all active:scale-95 ${stock <= 0 ? 'bg-background text-text-secondary cursor-not-allowed' : added ? 'bg-primary-container text-primary font-bold' : 'bg-primary text-white hover:bg-primary/90'
                  }`}>
                  {stock <= 0 ? 'Sản phẩm tạm hết' : added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
                </button>
                <button onClick={handleBuyNow} disabled={stock <= 0} className={`rounded-2xl px-5 py-4 text-h3 border transition-all active:scale-95 ${stock <= 0 ? 'border-border bg-background text-text-secondary cursor-not-allowed' : 'border-primary bg-card text-primary hover:bg-primary-light'
                  }`}>
                  Mua ngay
                </button>
              </div>
            )}
          </aside>
        </section>
        {/* Pre-order & Subscription */}
        {product.trang_thai_hsd !== 'can_han' && product.trang_thai_hsd !== 'het_han' && (
          <section className="flex flex-col items-center mt-8 md:mt-12">
            {stock <= 0 && (
            <div className="w-full max-w-3xl bg-card rounded-3xl p-5 md:p-xl border border-border shadow-card">
            <h2 className="text-h3 text-text-primary mb-lg text-center">Đặt trước sản phẩm</h2>
            <form onSubmit={handlePreorder} className="space-y-4">
              
              {/* Ép buộc Số lượng và Ngày nhận luôn ở trên 1 hàng với grid-cols-2 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-secondary">Số lượng ({product.don_vi})</label>
                  <input type="number" min="1" value={preorderForm.quantity} onChange={e => setPreorderForm({ ...preorderForm, quantity: Number(e.target.value) || 1 })} className="bg-card border border-border rounded-xl px-4 py-3 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder={`Số lượng (${product.don_vi})`} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-secondary">Ngày nhận hàng dự kiến</label>
                  <input type="date" value={preorderForm.ngay_giao_du_kien} onChange={e => setPreorderForm({ ...preorderForm, ngay_giao_du_kien: e.target.value })} min={new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]} max={new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]} className="bg-card border border-border rounded-xl px-4 py-3 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
              </div>
              
              <p className="text-[12px] font-medium text-text-secondary">Chọn trong khoảng 3–60 ngày tới. Nếu không chọn, hệ thống sẽ tự đặt ngày giao dự kiến sau 7 ngày.</p>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-text-secondary">Địa chỉ giao hàng</label>
                <textarea rows={3} value={preorderForm.dia_chi_giao} onChange={e => setPreorderForm({ ...preorderForm, dia_chi_giao: e.target.value })} placeholder="Ví dụ: 12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM" className="bg-card border border-border rounded-xl w-full resize-none px-4 py-3 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-text-secondary">Ghi chú (không bắt buộc)</label>
                <input value={preorderForm.ghi_chu} onChange={e => setPreorderForm({ ...preorderForm, ghi_chu: e.target.value })} placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao..." className="bg-card border border-border rounded-xl px-4 py-3 text-body w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-text-secondary">Phương thức thanh toán</label>
                <select value={preorderForm.phuong_thuc_tt} onChange={e => setPreorderForm({ ...preorderForm, phuong_thuc_tt: e.target.value })} className="bg-card border border-border rounded-xl px-4 py-3 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                  <option value="banking">🏦 Chuyển khoản ngân hàng (Sepay QR)</option>
                </select>
              </div>
              
              {/* MÃ GIẢM GIÁ CHO ĐẶT TRƯỚC */}
              <div className="pt-1">
                <span className="text-[13px] font-semibold text-text-primary flex items-center gap-1.5 mb-2.5">
                  <Tag size={14} className="text-primary" /> Mã giảm giá
                </span>
                {!preorderPromoCode ? (
                  <div className="flex gap-2">
                    <input
                      value={preorderPromoInput}
                      onChange={e => setPreorderPromoInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã giảm giá..."
                      className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-body text-text-primary uppercase tracking-wider focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:normal-case placeholder:tracking-normal"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPreorderCode(preorderPromoInput); } }}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPreorderCode(preorderPromoInput)}
                      disabled={!preorderPromoInput.trim() || preorderPromoLoading}
                      className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-body hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95"
                    >
                      {preorderPromoLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                      Áp dụng
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-background border border-border rounded-xl px-3.5 py-2.5">
                      <span className="text-body font-bold text-text-primary tracking-wider">{preorderPromoCode}</span>
                      <button type="button" onClick={() => { setPreorderPromoCode(''); setPreorderPromoResult(null); setPreorderPromoInput(''); }} className="text-text-secondary hover:text-danger transition-colors p-0.5">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
                {preorderPromoResult && (
                  <div className={`mt-2.5 rounded-xl p-3 text-[12px] font-medium flex items-start gap-2 ${
                    preorderPromoResult.error
                      ? 'bg-red-50 border border-red-200 text-danger'
                      : preorderPromoResult.used_code
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-blue-50 border border-blue-200 text-blue-700'
                  }`}>
                    {preorderPromoResult.error ? (
                      <><AlertCircle size={14} className="flex-shrink-0 mt-0.5" /><span>{preorderPromoResult.error}</span></>
                    ) : (
                      <><CheckCircle size={14} className="flex-shrink-0 mt-0.5" /><span>{preorderPromoResult.message}</span></>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-primary-light/20 rounded-xl p-4 space-y-3">
                {preorderForm.phuong_thuc_tt === 'banking' && (
                  <>
                    <p className="text-[12px] font-medium text-text-secondary">Hình thức thanh toán</p>
                    <div className="flex gap-3">
                      <label className={`flex-1 flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${preorderForm.loai_tien_coc === '30' ? 'border-primary bg-primary-light/30' : 'border-border hover:border-primary/40'}`}>
                        <input type="radio" name="deposit_preorder" value="30" checked={preorderForm.loai_tien_coc === '30'} onChange={e => setPreorderForm({ ...preorderForm, loai_tien_coc: e.target.value })} className="accent-primary" />
                        <div>
                          <span className="text-body font-bold text-text-primary block">Cọc 30%</span>
                          <span className="text-[12px] font-medium text-text-secondary">Thanh toán trước 30%, phần còn lại khi nhận hàng</span>
                        </div>
                      </label>
                      <label className={`flex-1 flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${preorderForm.loai_tien_coc === '100' ? 'border-primary bg-primary-light/30' : 'border-border hover:border-primary/40'}`}>
                        <input type="radio" name="deposit_preorder" value="100" checked={preorderForm.loai_tien_coc === '100'} onChange={e => setPreorderForm({ ...preorderForm, loai_tien_coc: e.target.value })} className="accent-primary" />
                        <div>
                          <span className="text-body font-bold text-text-primary block">Thanh toán toàn bộ</span>
                          <span className="text-[12px] font-medium text-text-secondary">Trả trước 100% khi đặt hàng</span>
                        </div>
                      </label>
                    </div>
                  </>
                )}
                {(() => {
                  const subtotal = (product.gia_ban || 0) * preorderForm.quantity;
                  const { tienGiam: autoDiscount, mienPhiShip: autoFreeship, appliedList } = calcPromotions(promotions, subtotal, preorderForm.quantity, 'dat_truoc');
                  
                  const hasCodeResult = preorderPromoResult && !preorderPromoResult.error && preorderPromoResult.tien_giam > 0;
                  const finalDiscount = hasCodeResult ? Number(preorderPromoResult.tien_giam) : autoDiscount;
                  const finalMienPhiShip = hasCodeResult ? preorderPromoResult.mien_phi_ship : autoFreeship;
                  
                  const subtotalAfterDiscount = Math.max(0, subtotal - finalDiscount - expiryDiscount);
                  const shippingFee = finalMienPhiShip ? 0 : 30000;
                  const finalTotal = subtotalAfterDiscount + shippingFee;
                  
                  const depositAmount = preorderForm.loai_tien_coc === '30' ? Math.round(subtotalAfterDiscount * 0.3) : finalTotal;
                  const remaining = finalTotal - depositAmount;
                  return (
                    <div className="text-body space-y-1">
                      {expiryDiscount > 0 && (
                        <p className="text-xs text-orange-600 font-semibold">Giảm giá cận hạn: -{formatCurrency(expiryDiscount)}</p>
                      )}
                      {hasCodeResult ? (
                        <p className="text-xs text-[#16A34A] font-semibold">{preorderPromoResult.message} (-{formatCurrency(finalDiscount)})</p>
                      ) : appliedList.map((item, i) => (
                        <p key={i} className="text-xs text-[#16A34A] font-semibold">{item.label}</p>
                      ))}
                      {shippingFee === 0 ? (
                        <p className="text-xs text-blue-600 font-semibold">Miễn phí vận chuyển (Đơn từ 500.000đ hoặc từ mã)</p>
                      ) : (
                        <p className="text-xs text-text-secondary">Phí vận chuyển: +{formatCurrency(30000)}</p>
                      )}
                      <p className="text-text-primary mt-2">Tổng tiền: <strong className="text-primary text-h3">{formatCurrency(finalTotal)}</strong></p>
                      {preorderForm.phuong_thuc_tt === 'banking' && (
                        <>
                          <p className="text-text-primary mt-1 font-bold">Số tiền cần chuyển khoản: {formatCurrency(depositAmount)}</p>
                          {remaining > 0 && <p className="text-text-secondary text-[12px] font-medium">Phần còn lại ({formatCurrency(remaining)}) thanh toán khi nhận hàng</p>}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {preorderMessage && <p className="text-body text-text-secondary">{preorderMessage}</p>}
              
              <button disabled={savingPreorder} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-5 py-3 font-bold transition-all active:scale-95">
                {savingPreorder ? 'Đang tạo...' : 'Đặt trước'}
              </button>
            </form>
          </div>
          )}

          {stock > 0 && (
          <div className="w-full max-w-3xl bg-card rounded-3xl p-5 md:p-xl border border-border shadow-card">
            <h2 className="text-h3 text-text-primary mb-lg text-center">Giao định kỳ</h2>
            <form onSubmit={handleSubscription} className="space-y-4">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-secondary">Số lượng / lần giao</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={subscriptionForm.quantity} 
                    onChange={e => setSubscriptionForm({ ...subscriptionForm, quantity: Number(e.target.value) || 1 })} 
                    placeholder={`Số lượng (${product.don_vi})`} 
                    className="bg-card border border-border rounded-xl px-3 sm:px-4 py-3 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none w-full" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-secondary">Chu kỳ giao</label>
                  <select 
                    value={subscriptionForm.tan_suat_giao} 
                    onChange={e => setSubscriptionForm({ ...subscriptionForm, tan_suat_giao: e.target.value })} 
                    className="bg-card border border-border rounded-xl px-2 sm:px-4 py-3 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none w-full"
                  >
                    <option value="hang_tuan">Hàng tuần</option>
                    <option value="hai_tuan">Hai tuần</option>
                    <option value="hang_thang">Hàng tháng</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-text-secondary">Tổng số lần giao</label>
                  <input 
                    type="number" 
                    min="2" 
                    value={subscriptionForm.so_ky_giao} 
                    onChange={e => setSubscriptionForm({ ...subscriptionForm, so_ky_giao: Number(e.target.value) || 2 })} 
                    placeholder="Số lần giao" 
                    className="bg-card border border-border rounded-xl px-3 sm:px-4 py-3 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none w-full" 
                  />
                </div>
              </div>

              <p className="text-[12px] font-medium text-text-secondary">Ví dụ: chọn "Hàng tuần" và nhập 4 lần → hệ thống sẽ giao liên tiếp trong 4 tuần.</p>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-text-secondary">Ngày bắt đầu giao lần đầu tiên</label>
                <input 
                  type="date" 
                  value={subscriptionForm.ngay_bat_dau} 
                  onChange={e => setSubscriptionForm({ ...subscriptionForm, ngay_bat_dau: e.target.value })} 
                  className="bg-card border border-border rounded-xl px-4 py-3 text-body w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-text-secondary">Địa chỉ giao hàng</label>
                <textarea 
                  rows={3} 
                  value={subscriptionForm.dia_chi_giao} 
                  onChange={e => setSubscriptionForm({ ...subscriptionForm, dia_chi_giao: e.target.value })} 
                  placeholder="Ví dụ: 12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM" 
                  className="bg-card border border-border rounded-xl w-full resize-none px-4 py-3 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-text-secondary">Ghi chú (không bắt buộc)</label>
                <input 
                  value={subscriptionForm.ghi_chu || ''} 
                  onChange={e => setSubscriptionForm({ ...subscriptionForm, ghi_chu: e.target.value })} 
                  placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao..." 
                  className="bg-card border border-border rounded-xl px-4 py-3 text-body w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-text-secondary">Phương thức thanh toán</label>
                <select 
                  value={subscriptionForm.phuong_thuc_tt} 
                  onChange={e => setSubscriptionForm({ ...subscriptionForm, phuong_thuc_tt: e.target.value })} 
                  className="bg-card border border-border rounded-xl px-4 py-3 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="banking">🏦 Chuyển khoản ngân hàng (Sepay QR)</option>
                </select>
              </div>

              {/* MÃ GIẢM GIÁ CHO ĐĂNG KÝ ĐỊNH KỲ */}
              <div className="pt-1">
                <span className="text-[13px] font-semibold text-text-primary flex items-center gap-1.5 mb-2.5">
                  <Tag size={14} className="text-primary" /> Mã giảm giá
                </span>
                {!subPromoCode ? (
                  <div className="flex gap-2">
                    <input
                      value={subPromoInput}
                      onChange={e => setSubPromoInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã giảm giá..."
                      className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-body text-text-primary uppercase tracking-wider focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:normal-case placeholder:tracking-normal"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplySubCode(subPromoInput); } }}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplySubCode(subPromoInput)}
                      disabled={!subPromoInput.trim() || subPromoLoading}
                      className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-body hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95"
                    >
                      {subPromoLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                      Áp dụng
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-background border border-border rounded-xl px-3.5 py-2.5">
                      <span className="text-body font-bold text-text-primary tracking-wider">{subPromoCode}</span>
                      <button type="button" onClick={() => { setSubPromoCode(''); setSubPromoResult(null); setSubPromoInput(''); }} className="text-text-secondary hover:text-danger transition-colors p-0.5">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
                {subPromoResult && (
                  <div className={`mt-2.5 rounded-xl p-3 text-[12px] font-medium flex items-start gap-2 ${
                    subPromoResult.error
                      ? 'bg-red-50 border border-red-200 text-danger'
                      : subPromoResult.used_code
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-blue-50 border border-blue-200 text-blue-700'
                  }`}>
                    {subPromoResult.error ? (
                      <><AlertCircle size={14} className="flex-shrink-0 mt-0.5" /><span>{subPromoResult.error}</span></>
                    ) : (
                      <><CheckCircle size={14} className="flex-shrink-0 mt-0.5" /><span>{subPromoResult.message}</span></>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-primary-light/20 rounded-xl p-4 space-y-3">
                {subscriptionForm.phuong_thuc_tt === 'banking' && (
                  <>
                    <p className="text-[12px] font-medium text-text-secondary">Hình thức thanh toán</p>
                    <div className="flex gap-3">
                      <label className={`flex-1 flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${subscriptionForm.loai_tien_coc === '30' ? 'border-primary bg-primary-light/30' : 'border-border hover:border-primary/40'}`}>
                        <input type="radio" name="deposit_sub" value="30" checked={subscriptionForm.loai_tien_coc === '30'} onChange={e => setSubscriptionForm({ ...subscriptionForm, loai_tien_coc: e.target.value })} className="accent-primary" />
                        <div>
                          <span className="text-body font-bold text-text-primary block">Cọc 30%</span>
                          <span className="text-[12px] font-medium text-text-secondary">Chuyển khoản cọc khi đăng ký. Tiền cọc sẽ được trừ trực tiếp vào tiền thanh toán của kỳ cuối cùng.</span>
                        </div>
                      </label>
                      <label className={`flex-1 flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${subscriptionForm.loai_tien_coc === '100' ? 'border-primary bg-primary-light/30' : 'border-border hover:border-primary/40'}`}>
                        <input type="radio" name="deposit_sub" value="100" checked={subscriptionForm.loai_tien_coc === '100'} onChange={e => setSubscriptionForm({ ...subscriptionForm, loai_tien_coc: e.target.value })} className="accent-primary" />
                        <div>
                          <span className="text-body font-bold text-text-primary block">Thanh toán toàn bộ</span>
                          <span className="text-[12px] font-medium text-text-secondary">Trả trước 100% khi đăng ký</span>
                        </div>
                      </label>
                    </div>
                  </>
                )}
                {(() => {
                  const subtotal = (product.gia_ban || 0) * subscriptionForm.quantity;
                  const { tienGiam: autoDiscount, mienPhiShip: autoFreeship, appliedList } = calcPromotions(promotions, subtotal, subscriptionForm.quantity, 'dinh_ky');
                  
                  const hasCodeResult = subPromoResult && !subPromoResult.error && subPromoResult.tien_giam > 0;
                  const finalDiscountFirstCycle = hasCodeResult ? Number(subPromoResult.tien_giam) : autoDiscount;
                  const finalMienPhiShipFirstCycle = hasCodeResult ? subPromoResult.mien_phi_ship : autoFreeship;
                  
                  const expiryDiscount = calculateExpiryDiscount(product, subscriptionForm.quantity);
                  const subtotalAfterDiscountFirst = Math.max(0, subtotal - finalDiscountFirstCycle - expiryDiscount);
                  const shippingFeeFirst = finalMienPhiShipFirstCycle ? 0 : 30000;
                  const finalTotalFirstCycle = subtotalAfterDiscountFirst + shippingFeeFirst;

                  const subtotalAfterDiscountNext = Math.max(0, subtotal - autoDiscount - expiryDiscount);
                  const shippingFeeNext = autoFreeship ? 0 : 30000;
                  const finalTotalNextCycles = subtotalAfterDiscountNext + shippingFeeNext;
                  
                  const depositAmount = subscriptionForm.loai_tien_coc === '30' ? Math.round(subtotalAfterDiscountFirst * 0.3) : finalTotalFirstCycle;
                  const remaining = finalTotalFirstCycle - depositAmount;
                  return (
                    <div className="text-body space-y-1">
                      {expiryDiscount > 0 && (
                        <p className="text-xs text-orange-600 font-semibold">Giảm giá cận hạn: -{formatCurrency(expiryDiscount)}</p>
                      )}
                      
                      <div className="mb-2 p-2 rounded-lg bg-white border border-border">
                        <p className="font-semibold text-[13px] text-text-primary mb-1">Kỳ đầu tiên:</p>
                        {hasCodeResult ? (
                          <p className="text-xs text-[#16A34A] font-semibold">{subPromoResult.message} (-{formatCurrency(finalDiscountFirstCycle)})</p>
                        ) : appliedList.map((item, i) => (
                          <p key={`first-${i}`} className="text-xs text-[#16A34A] font-semibold">{item.label}</p>
                        ))}
                        {shippingFeeFirst === 0 ? (
                          <p className="text-xs text-blue-600 font-semibold">Miễn phí vận chuyển (Đơn từ 500.000đ hoặc từ mã)</p>
                        ) : (
                          <p className="text-xs text-text-secondary">Phí vận chuyển: +{formatCurrency(30000)}</p>
                        )}
                        <p className="text-text-primary mt-1">Giá kỳ đầu: <strong className="text-primary text-h3">{formatCurrency(finalTotalFirstCycle)}</strong></p>
                        {subscriptionForm.phuong_thuc_tt === 'banking' && (
                          <div className="mt-1 border-t border-border/50 pt-1">
                            <p className="text-text-primary text-[13px] font-bold">Cần chuyển khoản: {formatCurrency(depositAmount)}</p>
                            {remaining > 0 && <p className="text-text-secondary text-[12px] font-medium">Phần còn lại ({formatCurrency(remaining)}) TT khi nhận</p>}
                          </div>
                        )}
                      </div>

                      {finalTotalFirstCycle !== finalTotalNextCycles && (
                        <div className="p-2 rounded-lg bg-background/50 border border-border border-dashed">
                          <p className="font-semibold text-[13px] text-text-primary mb-1">Các kỳ tiếp theo (tự động tính):</p>
                          {appliedList.map((item, i) => (
                            <p key={`next-${i}`} className="text-xs text-[#16A34A] font-semibold">{item.label}</p>
                          ))}
                          <p className="text-text-secondary mt-1 text-[13px]">Giá dự kiến: <strong>{formatCurrency(finalTotalNextCycles)}</strong>/kỳ</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {subscriptionMessage && <p className="text-body text-primary">{subscriptionMessage}</p>}
              <button disabled={savingSubscription} className="w-full bg-primary text-white rounded-xl px-5 py-3 font-bold transition-all active:scale-95">
                {savingSubscription ? 'Đang lưu...' : 'Đăng ký định kỳ'}
              </button>
            </form>
          </div>
          )}
        </section>
        )}

        {/* Reviews */}
        <section className="grid gap-xl lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="text-h2 text-text-primary mb-lg">Đánh giá sản phẩm</h2>
            <div className="space-y-4">
              {reviews.length ? reviews.map(review => <ReviewItem key={review.ma_danh_gia || `${review.ma_nguoi_mua}-${review.ngay_tao}`} review={review} />) : (
                <div className="rounded-2xl border border-dashed border-border bg-card py-xl text-center text-body text-text-secondary">Chưa có đánh giá nào.</div>
              )}
            </div>
          </div>
          <form onSubmit={handleReviewSubmit} className="bg-card rounded-3xl p-5 border border-border shadow-card self-start lg:sticky lg:top-28">
            <h3 className="text-h3 text-text-primary mb-4">Viết đánh giá</h3>
            <select value={reviewForm.so_sao} onChange={e => setReviewForm({ ...reviewForm, so_sao: Number(e.target.value) })} className="w-full bg-card border border-border rounded-xl px-4 py-3 text-body mb-4 focus:ring-2 focus:ring-primary focus:border-primary outline-none">
              {[5, 4, 3, 2, 1].map(star => <option key={star} value={star}>{star} sao</option>)}
            </select>
            <textarea rows={4} value={reviewForm.noi_dung} onChange={e => setReviewForm({ ...reviewForm, noi_dung: e.target.value })} placeholder="Chia sẻ trải nghiệm của bạn..." className="w-full bg-card border border-border rounded-xl resize-none px-4 py-3 text-body mb-4 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
            {reviewMessage && <p className="mb-3 text-body text-primary">{reviewMessage}</p>}
            <button disabled={savingReview} className="w-full bg-primary text-white rounded-xl px-5 py-3 font-bold transition-all active:scale-95">{savingReview ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
          </form>
        </section>

        {/* Related Products */}
        {relatedProducts.length ? (
          <section>
            <h2 className="text-h2 text-text-primary mb-lg">Sản phẩm liên quan</h2>
            <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map(item => (
                <Link key={item.ma_san_pham} to={`/products/${item.ma_san_pham}`} className="bg-card rounded-3xl overflow-hidden border border-border shadow-card transition-all hover:-translate-y-1 group">
                  <img src={pickProductImage(item)} alt={item.ten_san_pham} className="aspect-[4/3] w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="p-5">
                    <h3 className="text-h3 text-text-primary">{item.ten_san_pham}</h3>
                    <p className="mt-2 text-h2 text-text-secondary">{formatCurrency(item.gia_ban)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
