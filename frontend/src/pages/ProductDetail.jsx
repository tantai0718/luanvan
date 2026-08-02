import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { orderAPI, productAPI, reviewAPI, subscriptionAPI, promotionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { pickProductImage } from '../utils/marketImages';
import { Check, ShieldCheck, ChevronRight, ChevronLeft, Play, Minus, Plus, X, Eye } from 'lucide-react';

const isVideoUrl = url => /\.(mp4|webm|mov)$/i.test(url || '');
const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

function tinhSoNgayConLai(hanSuDung) {
  if (!hanSuDung) return null;
  const now = new Date();
  const han = new Date(hanSuDung);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(han.getFullYear(), han.getMonth(), han.getDate());
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
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
        appliedList.push({
          name: promo.ten_km,
          amount: discount,
          label: `${promo.ten_km} (-${Number(discount).toLocaleString('vi-VN')}đ)`,
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
  const { addToCart } = useCart();

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

  const [preorderForm, setPreorderForm] = useState({ quantity: 1, ngay_giao_du_kien: '', dia_chi_giao: user?.address || '', ghi_chu: '', phuong_thuc_tt: 'tien_mat', loai_tien_coc: '30' });
  const [preorderMessage, setPreorderMessage] = useState('');
  const [savingPreorder, setSavingPreorder] = useState(false);

  const [subscriptionForm, setSubscriptionForm] = useState({ quantity: 1, tan_suat_giao: 'hang_tuan', so_ky_giao: 4, ngay_bat_dau: '', dia_chi_giao: user?.address || '', ghi_chu: '', phuong_thuc_tt: 'tien_mat', loai_tien_coc: '30' });
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [savingSubscription, setSavingSubscription] = useState(false);

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

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'buyer') {
      alert('Chỉ tài khoản người mua mới có thể thêm vào giỏ hàng.');
      return;
    }
    if (stock <= 0) return;
    try { await addToCart(product.ma_san_pham, quantity); setAdded(true); setTimeout(() => setAdded(false), 1400); } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra, không thể thêm vào giỏ hàng.');
    }
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'buyer') {
      alert('Chỉ tài khoản người mua mới có thể mua hàng.');
      return;
    }
    if (stock <= 0) return;
    try { await addToCart(product.ma_san_pham, quantity); navigate('/cart'); } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra, không thể mua ngay.');
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
      const data = await orderAPI.createPreorder({ product_id: product.ma_san_pham, quantity: preorderForm.quantity, dia_chi_giao: preorderForm.dia_chi_giao, ghi_chu: preorderForm.ghi_chu, phuong_thuc_tt: preorderForm.phuong_thuc_tt, ngay_giao_du_kien: preorderForm.ngay_giao_du_kien, loai_tien_coc: preorderForm.phuong_thuc_tt === 'banking' ? preorderForm.loai_tien_coc : null });
      navigate(`/orders/${data.order.id}?success=1`);
    } catch (err) { setPreorderMessage(err.message || 'Không thể tạo đơn đặt trước.'); }
    finally { setSavingPreorder(false); }
  };

  const handleSubscription = async event => {
    event.preventDefault();
    if (!user) return navigate('/login');
    setSavingSubscription(true); setSubscriptionMessage('');
    try {
      const data = await subscriptionAPI.create({ product_id: product.ma_san_pham, quantity: subscriptionForm.quantity, dia_chi_giao: subscriptionForm.dia_chi_giao, ghi_chu: subscriptionForm.ghi_chu, phuong_thuc_tt: subscriptionForm.phuong_thuc_tt, ngay_bat_dau: subscriptionForm.ngay_bat_dau, tan_suat_giao: subscriptionForm.tan_suat_giao, so_ky_giao: subscriptionForm.so_ky_giao, loai_tien_coc: subscriptionForm.phuong_thuc_tt === 'banking' ? subscriptionForm.loai_tien_coc : null });
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
              <div className="flex items-baseline gap-2">
                <span className="text-h1 text-text-secondary">{formatCurrency(product.gia_ban)}</span>
                <span className="text-body text-text-secondary">/ {product.don_vi}</span>
              </div>
              <p className="mt-1 text-[12px] font-medium text-text-secondary">Giá đã bao gồm VAT nếu có.</p>
            </div>

            {/* Meta */}
            <div className="space-y-3 py-lg border-y border-border text-body text-text-secondary mb-lg">
              <div className="flex justify-between"><span>Nguồn hàng</span><strong className="text-text-primary">{product.ten_nong_trai || 'Farm2Table'}</strong></div>
              <div className="flex justify-between"><span>Khu vực</span><strong className="text-text-primary">{product.tinh_thanh || 'Toàn quốc'}</strong></div>
              <div className="flex justify-between"><span>Tồn kho</span><strong className="text-text-primary">{stock > 0 ? `${stock} ${product.don_vi}` : 'Tạm hết'}</strong></div>
              {product.han_su_dung && (() => {
                const soNgayConLai = tinhSoNgayConLai(product.han_su_dung);
                return (
                  <div className="flex justify-between">
                    <span>Hạn sử dụng</span>
                    <strong className={
                      product.trang_thai_hsd === 'het_han' ? 'text-rose-600' :
                      product.trang_thai_hsd === 'can_han' ? 'text-amber-600' :
                      'text-text-primary'
                    }>
                      {soNgayConLai === null ? new Date(product.han_su_dung).toLocaleDateString('vi-VN') :
                        soNgayConLai < 0 ? 'Đã hết hạn' :
                        soNgayConLai === 0 ? 'Hết hạn hôm nay' :
                        product.trang_thai_hsd === 'can_han' ? `Sắp hết hạn, còn ${soNgayConLai} ngày` :
                        `Còn ${soNgayConLai} ngày`}
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
                  <button onClick={() => setQuantity(p => Math.max(1, p - 1))} className="flex w-12 items-center justify-center hover:bg-background transition-all text-text-primary"><Minus size={16} /></button>
                  <span className="flex w-16 items-center justify-center font-bold text-h3 text-text-primary">{quantity}</span>
                  <button onClick={() => setQuantity(p => Math.min(maxQuantity, p + 1))} className="flex w-12 items-center justify-center hover:bg-background transition-all text-text-primary"><Plus size={16} /></button>
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
        <section className="grid gap-xl lg:grid-cols-2 mt-8 md:mt-12 items-start">
          <div className="bg-card rounded-3xl p-5 md:p-xl border border-border shadow-card">
            <h2 className="text-h3 text-text-primary mb-lg">Đặt trước sản phẩm</h2>
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
                  <option value="tien_mat">💵 Tiền mặt khi nhận hàng (COD)</option>
                  <option value="banking">🏦 Chuyển khoản ngân hàng (Sepay QR)</option>
                </select>
              </div>
              
              {preorderForm.phuong_thuc_tt === 'banking' && (
                <div className="bg-primary-light/20 rounded-xl p-4 space-y-3">
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
                  {(() => {
                    const subtotal = (product.gia_ban || 0) * preorderForm.quantity;
                    const { tienGiam: discount, mienPhiShip, appliedList } = calcPromotions(promotions, subtotal, preorderForm.quantity, 'dat_truoc');
                    const subtotalAfterDiscount = subtotal - discount;
                    const shippingFee = mienPhiShip ? 0 : 30000;
                    const finalTotal = subtotalAfterDiscount + shippingFee;
                    const depositAmount = preorderForm.loai_tien_coc === '30' ? Math.round(finalTotal * 0.3) : finalTotal;
                    const remaining = finalTotal - depositAmount;
                    return (
                      <div className="text-body space-y-1">
                        {appliedList.map((item, i) => (
                          <p key={i} className="text-xs text-[#16A34A] font-semibold">
                            {item.label}
                          </p>
                        ))}
                        {shippingFee === 0 ? (
                          <p className="text-xs text-blue-600 font-semibold"> Miễn phí vận chuyển (Đơn từ 500.000đ)</p>
                        ) : (
                          <p className="text-xs text-text-secondary">Phí vận chuyển: +{formatCurrency(30000)}</p>
                        )}
                        <p className="text-text-primary">Tổng tiền (tạm tính): <strong>{formatCurrency(finalTotal)}</strong></p>
                        <p className="text-primary font-bold">Số tiền cần chuyển khoản: {formatCurrency(depositAmount)}</p>
                        {remaining > 0 && <p className="text-text-secondary text-[12px] font-medium">Phần còn lại ({formatCurrency(remaining)}) thanh toán khi nhận hàng</p>}
                      </div>
                    );
                  })()}
                </div>
              )}
              
              {preorderMessage && <p className="text-body text-text-secondary">{preorderMessage}</p>}
              
              <button disabled={savingPreorder} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-5 py-3 font-bold transition-all active:scale-95">
                {savingPreorder ? 'Đang tạo...' : 'Đặt trước'}
              </button>
            </form>
          </div>

          <div className="bg-card rounded-3xl p-5 md:p-xl border border-border shadow-card">
            <h2 className="text-h3 text-text-primary mb-lg">Giao định kỳ</h2>
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
                  <option value="tien_mat">💵 Tiền mặt khi nhận hàng (COD)</option>
                  <option value="banking">🏦 Chuyển khoản ngân hàng (Sepay QR)</option>
                </select>
              </div>

              {subscriptionForm.phuong_thuc_tt === 'banking' && (
                <div className="bg-primary-light/20 rounded-xl p-4 space-y-3">
                  <p className="text-[12px] font-medium text-text-secondary">Hình thức thanh toán</p>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${subscriptionForm.loai_tien_coc === '30' ? 'border-primary bg-primary-light/30' : 'border-border hover:border-primary/40'}`}>
                      <input type="radio" name="deposit_sub" value="30" checked={subscriptionForm.loai_tien_coc === '30'} onChange={e => setSubscriptionForm({ ...subscriptionForm, loai_tien_coc: e.target.value })} className="accent-primary" />
                      <div>
                        <span className="text-body font-bold text-text-primary block">Cọc 30%</span>
                        <span className="text-[12px] font-medium text-text-secondary">Trả trước 30% mỗi kỳ, phần còn lại khi nhận</span>
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
                  {(() => {
                    const subtotal = (product.gia_ban || 0) * subscriptionForm.quantity;
                    const { tienGiam: discount, mienPhiShip, appliedList } = calcPromotions(promotions, subtotal, subscriptionForm.quantity, 'dinh_ky');
                    const subtotalAfterDiscount = subtotal - discount;
                    const shippingFee = mienPhiShip ? 0 : 30000;
                    const finalPerCycle = subtotalAfterDiscount + shippingFee;
                    const depositAmount = subscriptionForm.loai_tien_coc === '30' ? Math.round(finalPerCycle * 0.3) : finalPerCycle;
                    const remaining = finalPerCycle - depositAmount;
                    return (
                      <div className="text-body space-y-1">
                        {appliedList.map((item, i) => (
                          <p key={i} className="text-xs text-[#16A34A] font-semibold">
                            {item.label}
                          </p>
                        ))}
                        {shippingFee === 0 ? (
                          <p className="text-xs text-blue-600 font-semibold"> Miễn phí vận chuyển (Đơn từ 500.000đ)</p>
                        ) : (
                          <p className="text-xs text-text-secondary">Phí vận chuyển: +{formatCurrency(30000)}</p>
                        )}
                        <p className="text-text-primary">Giá mỗi kỳ (tạm tính): <strong>{formatCurrency(finalPerCycle)}</strong></p>
                        <p className="text-primary font-bold">Số tiền cần chuyển khoản: {formatCurrency(depositAmount)}</p>
                        {remaining > 0 && <p className="text-text-secondary text-[12px] font-medium">Phần còn lại ({formatCurrency(remaining)}) thanh toán khi nhận hàng</p>}
                      </div>
                    );
                  })()}
                </div>
              )}

              {subscriptionMessage && <p className="text-body text-primary">{subscriptionMessage}</p>}
              <button disabled={savingSubscription} className="w-full bg-primary text-white rounded-xl px-5 py-3 font-bold transition-all active:scale-95">
                {savingSubscription ? 'Đang lưu...' : 'Đăng ký định kỳ'}
              </button>
            </form>
          </div>
        </section>

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
