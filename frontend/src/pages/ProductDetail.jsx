import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { orderAPI, productAPI, subscriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { pickProductImage } from '../utils/marketImages';

const isVideoUrl = url => /\.(mp4|webm|mov)$/i.test(url || '');
const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

function ReviewItem({ review }) {
  const stars = Math.max(0, Math.min(5, Number(review.so_sao || 0)));
  return (
    <div className="bg-surface rounded-2xl p-4 border border-outline-variant organic-shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-title-md font-title-md text-on-surface">{review.ten_nguoi_mua || 'Khách hàng'}</p>
        <span className="text-sm text-secondary">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
      </div>
      <p className="mt-1 text-label-sm text-on-surface-variant">{review.ngay_tao ? new Date(review.ngay_tao).toLocaleDateString('vi-VN') : ''}</p>
      <p className="mt-3 text-body-md font-body-md text-on-surface-variant leading-relaxed">{review.noi_dung || 'Không có nhận xét thêm.'}</p>
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

  const [preorderForm, setPreorderForm] = useState({ quantity: 1, ngay_giao_du_kien: '', dia_chi_giao: user?.address || '', ghi_chu: '', phuong_thuc_tt: 'tien_mat' });
  const [preorderMessage, setPreorderMessage] = useState('');
  const [savingPreorder, setSavingPreorder] = useState(false);

  const [subscriptionForm, setSubscriptionForm] = useState({ quantity: 1, tan_suat_giao: 'hang_tuan', so_ky_giao: 4, ngay_bat_dau: '', dia_chi_giao: user?.address || '', ghi_chu: '', phuong_thuc_tt: 'tien_mat' });
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [savingSubscription, setSavingSubscription] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([productAPI.getById(id), productAPI.getReviews(id)])
      .then(([productData, reviewData]) => {
        const next = productData.product;
        setProduct(next);
        setReviews(reviewData.reviews || []);
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
        <div className="bg-surface rounded-3xl p-xl text-center max-w-lg w-full border border-outline-variant organic-shadow">
          <p className="text-title-md font-title-md text-on-surface">{error || 'Không tìm thấy sản phẩm.'}</p>
          <Link to="/products" className="mt-4 inline-flex bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  const stock = Number(product.ton_kho || 0);
  const maxQuantity = Math.max(1, stock || 1);

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'buyer' || stock <= 0) return;
    try { await addToCart(product.ma_san_pham, quantity); setAdded(true); setTimeout(() => setAdded(false), 1400); } catch { }
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'buyer' || stock <= 0) return;
    try { await addToCart(product.ma_san_pham, quantity); navigate('/cart'); } catch { }
  };

  const handleReviewSubmit = async event => {
    event.preventDefault();
    if (!user || user.role !== 'buyer') return navigate('/login');
    setSavingReview(true); setReviewMessage('');
    try {
      await productAPI.createReview({ ma_san_pham: product.ma_san_pham, ma_don_hang: null, so_sao: reviewForm.so_sao, noi_dung: reviewForm.noi_dung });
      const reviewData = await productAPI.getReviews(id);
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
      const data = await orderAPI.createPreorder({ product_id: product.ma_san_pham, quantity: preorderForm.quantity, dia_chi_giao: preorderForm.dia_chi_giao, ghi_chu: preorderForm.ghi_chu, phuong_thuc_tt: preorderForm.phuong_thuc_tt, ngay_giao_du_kien: preorderForm.ngay_giao_du_kien });
      navigate(`/orders/${data.order.id}?success=1`);
    } catch (err) { setPreorderMessage(err.message || 'Không thể tạo đơn đặt trước.'); }
    finally { setSavingPreorder(false); }
  };

  const handleSubscription = async event => {
    event.preventDefault();
    if (!user) return navigate('/login');
    setSavingSubscription(true); setSubscriptionMessage('');
    try {
      await subscriptionAPI.create({ product_id: product.ma_san_pham, quantity: subscriptionForm.quantity, dia_chi_giao: subscriptionForm.dia_chi_giao, ghi_chu: subscriptionForm.ghi_chu, phuong_thuc_tt: subscriptionForm.phuong_thuc_tt, ngay_bat_dau: subscriptionForm.ngay_bat_dau, tan_suat_giao: subscriptionForm.tan_suat_giao, so_ky_giao: subscriptionForm.so_ky_giao });
      setSubscriptionMessage('Đăng ký giao định kỳ thành công.');
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
                    <div className="w-full h-full bg-surface flex items-center justify-center"><span className="material-symbols-outlined text-white">play_arrow</span></div>
                  ) : (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
            <button className="absolute top-4 right-4 text-white" onClick={() => setMobileGalleryOpen(false)}><span className="material-symbols-outlined text-3xl">close</span></button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop space-y-xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-body-md font-body-md text-on-surface-variant">
          <Link to="/" className="hover:text-primary">Trang chủ</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <Link to="/products" className="hover:text-primary">Sản phẩm</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface">{product.ten_san_pham}</span>
        </nav>

        {/* Product Main Section */}
        <section className="grid gap-xl lg:grid-cols-12">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-28 space-y-4">
              <div
                className="rounded-3xl overflow-hidden bg-surface-container-high cursor-pointer organic-shadow aspect-square"
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
                  <button key={i} onClick={() => setActiveImage(img)} className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImage === img ? 'border-primary organic-shadow-sm' : 'border-transparent hover:border-outline-variant'
                  }`}>
                    {isVideoUrl(img) ? (
                      <div className="w-full h-full bg-surface flex items-center justify-center relative">
                        <img src="/images/ngucoc.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        <span className="material-symbols-outlined text-on-surface relative z-10">play_arrow</span>
                      </div>
                    ) : (
                      <img src={img} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <aside className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-on-primary-fixed-variant font-label-sm">
              <span className="material-symbols-outlined text-sm">verified</span>
              Nguồn hàng chọn lọc
            </div>
            <h1 className="text-display-lg font-display-lg text-on-surface mt-3 mb-3">{product.ten_san_pham}</h1>
            <div className="flex items-center gap-3 text-body-md font-body-md text-on-surface-variant mb-lg">
              <span className="text-secondary font-bold">★ {Number(product.diem_danh_gia || 0).toFixed(1)}</span>
              <span>({product.tong_danh_gia || reviews.length} đánh giá)</span>
              <span className="rounded-full bg-secondary-container text-on-secondary-container px-3 py-0.5">{product.ten_danh_muc || 'Nông sản'}</span>
            </div>

            {/* Price */}
            <div className="bg-surface-container-low rounded-3xl p-lg mb-lg">
              <div className="flex items-baseline gap-2">
                <span className="text-display-lg font-display-lg text-secondary">{formatCurrency(product.gia_ban)}</span>
                <span className="text-body-md text-on-surface-variant">/ {product.don_vi}</span>
              </div>
              <p className="mt-1 text-label-sm text-on-surface-variant">Giá đã bao gồm VAT nếu có.</p>
            </div>

            {/* Description */}
            {product.mo_ta && (
              <div className="bg-surface-container-low rounded-2xl px-lg py-md mb-lg">
                <p className="text-label-sm font-label-sm text-primary uppercase tracking-widest mb-2">Mô tả sản phẩm</p>
                <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">{product.mo_ta}</p>
              </div>
            )}

            {/* Meta */}
            <div className="space-y-3 py-lg border-y border-outline-variant text-body-md font-body-md text-on-surface-variant mb-lg">
              <div className="flex justify-between"><span>Nguồn hàng</span><strong className="text-on-surface">{product.ten_nong_trai || 'Farm2Table'}</strong></div>
              <div className="flex justify-between"><span>Khu vực</span><strong className="text-on-surface">{product.tinh_thanh || 'Toàn quốc'}</strong></div>
              <div className="flex justify-between"><span>Tồn kho</span><strong className="text-on-surface">{stock > 0 ? `${stock} ${product.don_vi}` : 'Tạm hết'}</strong></div>
            </div>

            {/* Quantity */}
            <div className="mb-lg">
              <span className="text-body-md font-body-md text-on-surface block mb-3">Số lượng</span>
              <div className="flex items-center gap-4">
                <div className="flex h-12 overflow-hidden rounded-2xl border border-outline-variant bg-surface">
                  <button onClick={() => setQuantity(p => Math.max(1, p - 1))} className="flex w-12 items-center justify-center hover:bg-surface-container-high transition-all text-on-surface"><span className="material-symbols-outlined">remove</span></button>
                  <span className="flex w-16 items-center justify-center font-bold text-title-md text-on-surface">{quantity}</span>
                  <button onClick={() => setQuantity(p => Math.min(maxQuantity, p + 1))} className="flex w-12 items-center justify-center hover:bg-surface-container-high transition-all text-on-surface"><span className="material-symbols-outlined">add</span></button>
                </div>
                <span className="text-body-md text-on-surface-variant">Còn {stock} trong kho</span>
              </div>
            </div>

            {/* Actions */}
            {user?.role === 'admin' ? (
              <div className="bg-surface-container-low rounded-2xl px-lg py-3 text-body-md text-on-surface-variant">Tài khoản quản trị không dùng để mua hàng.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={handleAddToCart} disabled={stock <= 0} className={`rounded-2xl px-lg py-4 text-title-md font-title-md transition-all active:scale-95 ${
                  stock <= 0 ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed' : added ? 'bg-primary-container text-on-primary-container font-bold' : 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant'
                }`}>
                  {stock <= 0 ? 'Sản phẩm tạm hết' : added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
                </button>
                <button onClick={handleBuyNow} disabled={stock <= 0} className={`rounded-2xl px-lg py-4 text-title-md font-title-md border transition-all active:scale-95 ${
                  stock <= 0 ? 'border-outline bg-surface-container-high text-on-surface-variant cursor-not-allowed' : 'border-primary bg-surface text-primary hover:bg-primary-fixed'
                }`}>
                  Mua ngay
                </button>
              </div>
            )}
          </aside>
        </section>

        {/* Pre-order & Subscription */}
        <section className="grid gap-xl lg:grid-cols-2">
          <div className="bg-surface rounded-3xl p-lg md:p-xl border border-outline-variant organic-shadow">
            <h2 className="text-title-md font-title-md text-on-surface mb-lg">Đặt trước sản phẩm</h2>
            <form onSubmit={handlePreorder} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="number" min="1" value={preorderForm.quantity} onChange={e => setPreorderForm({ ...preorderForm, quantity: Number(e.target.value) || 1 })} className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Số lượng" />
                <input type="date" value={preorderForm.ngay_giao_du_kien} onChange={e => setPreorderForm({ ...preorderForm, ngay_giao_du_kien: e.target.value })} min={new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]} max={new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]} className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>
              <p className="text-label-sm text-on-surface-variant">Chọn trong khoảng 3–60 ngày tới. Nếu không chọn, hệ thống sẽ tự đặt ngày giao dự kiến sau 7 ngày.</p>
              <textarea rows={3} value={preorderForm.dia_chi_giao} onChange={e => setPreorderForm({ ...preorderForm, dia_chi_giao: e.target.value })} placeholder="Địa chỉ giao hàng" className="bg-surface border border-outline-variant rounded-xl w-full resize-none px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              <input value={preorderForm.ghi_chu} onChange={e => setPreorderForm({ ...preorderForm, ghi_chu: e.target.value })} placeholder="Ghi chú thêm" className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              {preorderMessage && <p className="text-body-md text-secondary">{preorderMessage}</p>}
              <button disabled={savingPreorder} className="w-full bg-secondary text-on-secondary rounded-xl px-lg py-3 font-bold transition-all active:scale-95">{savingPreorder ? 'Đang tạo...' : 'Đặt trước'}</button>
            </form>
          </div>

          <div className="bg-surface rounded-3xl p-lg md:p-xl border border-outline-variant organic-shadow">
            <h2 className="text-title-md font-title-md text-on-surface mb-lg">Giao định kỳ</h2>
            <form onSubmit={handleSubscription} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <input type="number" min="1" value={subscriptionForm.quantity} onChange={e => setSubscriptionForm({ ...subscriptionForm, quantity: Number(e.target.value) || 1 })} className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                <select value={subscriptionForm.tan_suat_giao} onChange={e => setSubscriptionForm({ ...subscriptionForm, tan_suat_giao: e.target.value })} className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                  <option value="hang_tuan">Hàng tuần</option>
                  <option value="hai_tuan">Hai tuần</option>
                  <option value="hang_thang">Hàng tháng</option>
                </select>
                <input type="number" min="2" value={subscriptionForm.so_ky_giao} onChange={e => setSubscriptionForm({ ...subscriptionForm, so_ky_giao: Number(e.target.value) || 2 })} className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>
              <input type="date" value={subscriptionForm.ngay_bat_dau} onChange={e => setSubscriptionForm({ ...subscriptionForm, ngay_bat_dau: e.target.value })} className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              <textarea rows={3} value={subscriptionForm.dia_chi_giao} onChange={e => setSubscriptionForm({ ...subscriptionForm, dia_chi_giao: e.target.value })} placeholder="Địa chỉ giao hàng" className="bg-surface border border-outline-variant rounded-xl w-full resize-none px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              {subscriptionMessage && <p className="text-body-md text-primary">{subscriptionMessage}</p>}
              <button disabled={savingSubscription} className="w-full bg-primary text-on-primary rounded-xl px-lg py-3 font-bold transition-all active:scale-95">{savingSubscription ? 'Đang lưu...' : 'Đăng ký định kỳ'}</button>
            </form>
          </div>
        </section>

        {/* Reviews */}
        <section className="grid gap-xl lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="text-headline-lg font-headline-lg text-on-surface mb-lg">Đánh giá sản phẩm</h2>
            <div className="space-y-4">
              {reviews.length ? reviews.map(review => <ReviewItem key={review.ma_danh_gia || `${review.ma_nguoi_mua}-${review.ngay_tao}`} review={review} />) : (
                <div className="rounded-2xl border border-dashed border-outline-variant bg-surface py-xl text-center text-body-md text-on-surface-variant">Chưa có đánh giá nào.</div>
              )}
            </div>
          </div>
          <form onSubmit={handleReviewSubmit} className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow self-start lg:sticky lg:top-28">
            <h3 className="text-title-md font-title-md text-on-surface mb-4">Viết đánh giá</h3>
            <select value={reviewForm.so_sao} onChange={e => setReviewForm({ ...reviewForm, so_sao: Number(e.target.value) })} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md mb-4 focus:ring-2 focus:ring-primary focus:border-primary outline-none">
              {[5, 4, 3, 2, 1].map(star => <option key={star} value={star}>{star} sao</option>)}
            </select>
            <textarea rows={4} value={reviewForm.noi_dung} onChange={e => setReviewForm({ ...reviewForm, noi_dung: e.target.value })} placeholder="Chia sẻ trải nghiệm của bạn..." className="w-full bg-surface border border-outline-variant rounded-xl resize-none px-4 py-3 text-body-md mb-4 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
            {reviewMessage && <p className="mb-3 text-body-md text-primary">{reviewMessage}</p>}
            <button disabled={savingReview} className="w-full bg-primary text-on-primary rounded-xl px-lg py-3 font-bold transition-all active:scale-95">{savingReview ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
          </form>
        </section>

        {/* Related Products */}
        {relatedProducts.length ? (
          <section>
            <h2 className="text-headline-lg font-headline-lg text-on-surface mb-lg">Sản phẩm liên quan</h2>
            <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map(item => (
                <Link key={item.ma_san_pham} to={`/products/${item.ma_san_pham}`} className="bg-surface rounded-3xl overflow-hidden border border-outline-variant organic-shadow transition-all hover:-translate-y-1 group">
                  <img src={pickProductImage(item)} alt={item.ten_san_pham} className="aspect-[4/3] w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="p-lg">
                    <h3 className="text-title-md font-title-md text-on-surface">{item.ten_san_pham}</h3>
                    <p className="mt-2 text-headline-lg font-headline-lg text-secondary">{formatCurrency(item.gia_ban)}</p>
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
