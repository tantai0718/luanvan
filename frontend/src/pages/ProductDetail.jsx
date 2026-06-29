import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { orderAPI, productAPI, subscriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { pickProductImage } from '../utils/marketImages';

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

function ReviewItem({ review }) {
  const stars = Math.max(0, Math.min(5, Number(review.so_sao || 0)));
  return (
    <div className="rounded-2xl border border-[#dce7df] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">{review.ten_nguoi_mua || 'Khách hàng'}</p>
        <span className="text-sm text-[#713900]">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {review.ngay_tao ? new Date(review.ngay_tao).toLocaleDateString('vi-VN') : 'Chưa rõ ngày'}
      </p>
      <p className="mt-3 text-sm leading-7 text-slate-600">{review.noi_dung || 'Không có nhận xét thêm.'}</p>
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

  const [reviewForm, setReviewForm] = useState({ so_sao: 5, noi_dung: '' });
  const [reviewMessage, setReviewMessage] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const [preorderForm, setPreorderForm] = useState({
    quantity: 1,
    ngay_giao_du_kien: '',
    dia_chi_giao: user?.address || '',
    ghi_chu: '',
    phuong_thuc_tt: 'tien_mat',
  });
  const [preorderMessage, setPreorderMessage] = useState('');
  const [savingPreorder, setSavingPreorder] = useState(false);

  const [subscriptionForm, setSubscriptionForm] = useState({
    quantity: 1,
    tan_suat_giao: 'hang_tuan',
    so_ky_giao: 4,
    ngay_bat_dau: '',
    dia_chi_giao: user?.address || '',
    ghi_chu: '',
    phuong_thuc_tt: 'tien_mat',
  });
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
        const initialImage = firstImage
          ? (firstImage.startsWith('/upload/') ? `${BACKEND}${firstImage}` : firstImage)
          : pickProductImage(next);
        setActiveImage(initialImage);
      })
      .catch(err => setError(err.message || 'Không tải được thông tin sản phẩm.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product?.ma_danh_muc) return;
    productAPI
      .getAll(`?category=${product.ma_danh_muc}&limit=4`)
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
    // Chuyển tất cả URL trong product.images thành URL đầy đủ
    const list = (product.images || []).map(img =>
      img.startsWith('/upload/') ? `${BACKEND}${img}` : img
    );
    const primary = pickProductImage(product);
    return Array.from(new Set([primary, ...list].filter(Boolean)));
  }, [product]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2d9e63] border-t-transparent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="market-panel w-full max-w-xl p-8 text-center">
          <p className="text-lg font-semibold text-slate-800">{error || 'Không tìm thấy sản phẩm.'}</p>
          <Link to="/products" className="mt-4 inline-flex rounded-full bg-[#1a7a4a] px-5 py-2.5 text-sm font-semibold text-white">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const stock = Number(product.ton_kho || 0);
  const maxQuantity = Math.max(1, stock || 1);

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'buyer' || stock <= 0) return;
    try {
      await addToCart(product.ma_san_pham, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    } catch { }
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'buyer' || stock <= 0) return;
    try {
      await addToCart(product.ma_san_pham, quantity);
      navigate('/cart');
    } catch { }
  };

  const handleReviewSubmit = async event => {
    event.preventDefault();
    if (!user || user.role !== 'buyer') return navigate('/login');
    setSavingReview(true);
    setReviewMessage('');
    try {
      await productAPI.createReview({
        ma_san_pham: product.ma_san_pham,
        ma_don_hang: null,
        so_sao: reviewForm.so_sao,
        noi_dung: reviewForm.noi_dung,
      });
      const reviewData = await productAPI.getReviews(id);
      setReviews(reviewData.reviews || []);
      setReviewForm({ so_sao: 5, noi_dung: '' });
      setReviewMessage('Đánh giá của bạn đã được ghi nhận.');
    } catch (err) {
      setReviewMessage(err.message || 'Không thể gửi đánh giá.');
    } finally {
      setSavingReview(false);
    }
  };

  const handlePreorder = async event => {
    event.preventDefault();
    if (!user) return navigate('/login');
    setSavingPreorder(true);
    setPreorderMessage('');
    try {
      const data = await orderAPI.createPreorder({
        product_id: product.ma_san_pham,
        quantity: preorderForm.quantity,
        dia_chi_giao: preorderForm.dia_chi_giao,
        ghi_chu: preorderForm.ghi_chu,
        phuong_thuc_tt: preorderForm.phuong_thuc_tt,
        ngay_giao_du_kien: preorderForm.ngay_giao_du_kien,
      });
      navigate(`/orders/${data.order.id}?success=1`);
    } catch (err) {
      setPreorderMessage(err.message || 'Không thể tạo đơn đặt trước.');
    } finally {
      setSavingPreorder(false);
    }
  };

  const handleSubscription = async event => {
    event.preventDefault();
    if (!user) return navigate('/login');
    setSavingSubscription(true);
    setSubscriptionMessage('');
    try {
      await subscriptionAPI.create({
        product_id: product.ma_san_pham,
        quantity: subscriptionForm.quantity,
        dia_chi_giao: subscriptionForm.dia_chi_giao,
        ghi_chu: subscriptionForm.ghi_chu,
        phuong_thuc_tt: subscriptionForm.phuong_thuc_tt,
        ngay_bat_dau: subscriptionForm.ngay_bat_dau,
        tan_suat_giao: subscriptionForm.tan_suat_giao,
        so_ky_giao: subscriptionForm.so_ky_giao,
      });
      setSubscriptionMessage('Đăng ký giao định kỳ thành công.');
    } catch (err) {
      setSubscriptionMessage(err.message || 'Không thể tạo đăng ký giao định kỳ.');
    } finally {
      setSavingSubscription(false);
    }
  };

  return (
    <div className="market-shell pb-10">
      <div className="market-page space-y-8 py-8 md:py-10">
        <nav className="flex items-center gap-2 text-sm text-white/70">
          <Link to="/" className="hover:text-white">Trang chủ</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link to="/products" className="hover:text-white">Sản phẩm</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-white">{product.ten_san_pham}</span>
        </nav>

        <section className="grid gap-10 border-b border-[#d7ddd8] pb-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="sticky top-28 space-y-4">
              <div className="overflow-hidden rounded-2xl bg-[#efeded] shadow-sm">
                {console.log('activeImage:', activeImage)}
                {console.log('product.images:', product.images)}
                <img src={activeImage || pickProductImage(product)} alt={product.ten_san_pham} className="aspect-square w-full object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-3 md:grid-cols-5">
                {images.map((image, index) => (
                  <button
                    key={`${index}-${image}`}
                    onClick={() => setActiveImage(image)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 bg-white ${activeImage === image ? 'border-[#0f5238]' : 'border-transparent hover:border-[#bfc9c1]'}`}
                  >
                    <img src={image} alt={`Ảnh ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e8f5ee] px-3 py-1 text-[#0f5238]">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="text-sm font-semibold">Nguồn hàng chọn lọc</span>
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">{product.ten_san_pham}</h1>
            <div className="mt-4 flex items-center gap-3 text-sm">
              <span className="text-[#713900]">★ {Number(product.diem_danh_gia || 0).toFixed(1)}</span>
              <span className="text-white/70">({product.tong_danh_gia || reviews.length} đánh giá)</span>
              <span className="rounded-full bg-[#ffdad2] px-3 py-1 text-[#83260e]">{product.ten_danh_muc || 'Nông sản'}</span>
            </div>

            <div className="mt-6 rounded-2xl bg-[#f5f3f3] p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#a33d23]">{formatCurrency(product.gia_ban)}</span>
                <span className="text-sm text-[#404943]">/ {product.don_vi}</span>
              </div>
              <p className="mt-2 text-xs italic text-[#707973]">Giá đã bao gồm VAT nếu có.</p>
            </div>
            {product.mo_ta ? (
              <div className="mt-6 rounded-2xl bg-white/10 px-5 py-4 text-sm leading-7 text-white/90">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">Mô tả sản phẩm</p>
                <p>{product.mo_ta}</p>
              </div>
            ) : null}
            <div className="mt-6 space-y-4 border-y border-[#2d6a4f] py-5 text-sm text-white/75">
              <div className="flex justify-between gap-3"><span>Nguồn hàng</span><strong className="text-white">{product.ten_nong_trai || 'Farm2Table'}</strong></div>
              <div className="flex justify-between gap-3"><span>Khu vực</span><strong className="text-white">{product.tinh_thanh || 'Toàn quốc'}</strong></div>
              <div className="flex justify-between gap-3"><span>Tồn kho</span><strong className="text-white">{stock > 0 ? `${stock} ${product.don_vi}` : 'Tạm hết'}</strong></div>
            </div>

            <div className="mt-6">
              <span className="mb-3 block text-sm font-semibold">Số lượng</span>
              <div className="flex items-center gap-4">
                <div className="flex h-12 overflow-hidden rounded-lg border border-[#d7ddd8] bg-white">
                  <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="flex w-12 items-center justify-center hover:bg-[#f5f3f3]">
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <span className="flex w-16 items-center justify-center font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(prev => Math.min(maxQuantity, prev + 1))} className="flex w-12 items-center justify-center hover:bg-[#f5f3f3]">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <span className="text-sm text-white/70">Còn {stock} trong kho</span>
              </div>
            </div>

            {user?.role === 'admin' ? (
              <div className="mt-6 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">Tài khoản quản trị không dùng để mua hàng.</div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button onClick={handleAddToCart} disabled={stock <= 0} className={`rounded-xl px-5 py-4 text-sm font-semibold ${stock <= 0 ? 'bg-slate-200 text-slate-500' : added ? 'bg-[#e8f5ee] text-[#1a7a4a]' : 'bg-[#0f5238] text-white hover:bg-[#0a402b]'}`}>
                  {stock <= 0 ? 'Sản phẩm tạm hết' : added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
                </button>
                <button onClick={handleBuyNow} disabled={stock <= 0} className={`rounded-xl border px-5 py-4 text-sm font-semibold ${stock <= 0 ? 'border-slate-200 bg-slate-200 text-slate-500' : 'border-[#0f5238] bg-white text-[#0f5238] hover:bg-[#f5f3f3]'}`}>
                  Mua ngay
                </button>
              </div>
            )}
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="market-panel p-6">
            <div className="market-section-title"><h2>Đặt trước sản phẩm</h2></div>
            <form onSubmit={handlePreorder} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="number" min="1" value={preorderForm.quantity} onChange={event => setPreorderForm({ ...preorderForm, quantity: Number(event.target.value) || 1 })} className="market-field px-4 py-3 text-sm" placeholder="Số lượng" />
                <input type="date" value={preorderForm.ngay_giao_du_kien} onChange={event => setPreorderForm({ ...preorderForm, ngay_giao_du_kien: event.target.value })} className="market-field px-4 py-3 text-sm" />
              </div>
              <textarea rows={3} value={preorderForm.dia_chi_giao} onChange={event => setPreorderForm({ ...preorderForm, dia_chi_giao: event.target.value })} placeholder="Địa chỉ giao hàng" className="market-field w-full resize-none px-4 py-3 text-sm" />
              <input value={preorderForm.ghi_chu} onChange={event => setPreorderForm({ ...preorderForm, ghi_chu: event.target.value })} placeholder="Ghi chú thêm" className="market-field px-4 py-3 text-sm" />
              {preorderMessage ? <p className="text-sm text-[#a33d23]">{preorderMessage}</p> : null}
              <button disabled={savingPreorder} className="w-full rounded-xl bg-[#a33d23] px-5 py-3 text-sm font-semibold text-white">{savingPreorder ? 'Đang tạo...' : 'Đặt trước'}</button>
            </form>
          </div>

          <div className="market-panel p-6">
            <div className="market-section-title"><h2>Giao định kỳ</h2></div>
            <form onSubmit={handleSubscription} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <input type="number" min="1" value={subscriptionForm.quantity} onChange={event => setSubscriptionForm({ ...subscriptionForm, quantity: Number(event.target.value) || 1 })} className="market-field px-4 py-3 text-sm" />
                <select value={subscriptionForm.tan_suat_giao} onChange={event => setSubscriptionForm({ ...subscriptionForm, tan_suat_giao: event.target.value })} className="market-field px-4 py-3 text-sm">
                  <option value="hang_tuan">Hàng tuần</option>
                  <option value="hai_tuan">Hai tuần</option>
                  <option value="hang_thang">Hàng tháng</option>
                </select>
                <input type="number" min="2" value={subscriptionForm.so_ky_giao} onChange={event => setSubscriptionForm({ ...subscriptionForm, so_ky_giao: Number(event.target.value) || 2 })} className="market-field px-4 py-3 text-sm" />
              </div>
              <input type="date" value={subscriptionForm.ngay_bat_dau} onChange={event => setSubscriptionForm({ ...subscriptionForm, ngay_bat_dau: event.target.value })} className="market-field px-4 py-3 text-sm" />
              <textarea rows={3} value={subscriptionForm.dia_chi_giao} onChange={event => setSubscriptionForm({ ...subscriptionForm, dia_chi_giao: event.target.value })} placeholder="Địa chỉ giao hàng" className="market-field w-full resize-none px-4 py-3 text-sm" />
              {subscriptionMessage ? <p className="text-sm text-[#0f5238]">{subscriptionMessage}</p> : null}
              <button disabled={savingSubscription} className="w-full rounded-xl bg-[#0f5238] px-5 py-3 text-sm font-semibold text-white">{savingSubscription ? 'Đang lưu...' : 'Đăng ký định kỳ'}</button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="market-section-title"><h2>Đánh giá sản phẩm</h2></div>
            <div className="grid gap-4">
              {reviews.length ? reviews.map(review => <ReviewItem key={review.ma_danh_gia || `${review.ma_nguoi_mua}-${review.ngay_tao}`} review={review} />) : (
                <div className="rounded-2xl border border-dashed border-[#d7ddd8] bg-white py-10 text-center text-sm text-[#707973]">Chưa có đánh giá nào.</div>
              )}
            </div>
          </div>
          <form onSubmit={handleReviewSubmit} className="market-panel p-5">
            <h3 className="text-lg font-bold">Viết đánh giá</h3>
            <select value={reviewForm.so_sao} onChange={event => setReviewForm({ ...reviewForm, so_sao: Number(event.target.value) })} className="market-field mt-4 px-4 py-3 text-sm">
              {[5, 4, 3, 2, 1].map(star => <option key={star} value={star}>{star} sao</option>)}
            </select>
            <textarea rows={4} value={reviewForm.noi_dung} onChange={event => setReviewForm({ ...reviewForm, noi_dung: event.target.value })} placeholder="Chia sẻ trải nghiệm của bạn..." className="market-field mt-4 w-full resize-none px-4 py-3 text-sm" />
            {reviewMessage ? <p className="mt-3 text-sm text-[#0f5238]">{reviewMessage}</p> : null}
            <button disabled={savingReview} className="mt-4 w-full rounded-xl bg-[#0f5238] px-5 py-3 text-sm font-semibold text-white">{savingReview ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
          </form>
        </section>

        {relatedProducts.length ? (
          <section>
            <div className="market-section-title"><h2>Sản phẩm liên quan</h2></div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map(item => (
                <Link key={item.ma_san_pham} to={`/products/${item.ma_san_pham}`} className="market-panel overflow-hidden transition hover:-translate-y-1">
                  <img src={pickProductImage(item)} alt={item.ten_san_pham} className="aspect-[4/3] w-full object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold">{item.ten_san_pham}</h3>
                    <p className="mt-2 text-[#0f5238]">{formatCurrency(item.gia_ban)}</p>
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
