import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { orderAPI, productAPI, subscriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}₫`;
const placeholderImage = 'https://placehold.co/800x620/e8f5ee/1a7a4a?text=Nong+San';

function ReviewItem({ review }) {
  return (
    <div className="rounded-[18px] border border-[#dce7df] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">{review.ten_nguoi_mua || 'Khách hàng'}</p>
        <span className="text-sm text-amber-500">{'★'.repeat(Number(review.so_sao || 0))}</span>
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
        setActiveImage(next.images?.[0] || placeholderImage);
      })
      .catch(err => setError(err.message || 'Không tải được thông tin sản phẩm.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product?.ma_danh_muc) return;
    productAPI
      .getAll(`?category=${product.ma_danh_muc}&limit=4`)
      .then(data =>
        setRelatedProducts((data.products || []).filter(item => item.ma_san_pham !== product.ma_san_pham).slice(0, 3))
      )
      .catch(() => setRelatedProducts([]));
  }, [product]);

  useEffect(() => {
    setPreorderForm(prev => ({ ...prev, dia_chi_giao: user?.address || prev.dia_chi_giao }));
    setSubscriptionForm(prev => ({ ...prev, dia_chi_giao: user?.address || prev.dia_chi_giao }));
  }, [user]);

  const images = useMemo(() => {
    if (!product) return [];
    return product.images?.length ? product.images : [placeholderImage];
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
          <Link
            to="/products"
            className="mt-4 inline-flex rounded-full bg-[#1a7a4a] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const stock = Number(product.ton_kho || 0);
  const maxQuantity = Math.max(1, stock || 1);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer' || stock <= 0) return;
    try {
      await addToCart(product.ma_san_pham, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    } catch {}
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer' || stock <= 0) return;
    try {
      await addToCart(product.ma_san_pham, quantity);
      navigate('/cart');
    } catch {}
  };

  const handleReviewSubmit = async event => {
    event.preventDefault();
    if (!user || user.role !== 'buyer') {
      navigate('/login');
      return;
    }
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
    if (!user) {
      navigate('/login');
      return;
    }
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
    if (!user) {
      navigate('/login');
      return;
    }
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
        <div className="text-sm text-slate-500">
          <Link to="/" className="hover:text-[#1a7a4a]">Trang chủ</Link> /{' '}
          <Link to="/products" className="hover:text-[#1a7a4a]">Sản phẩm</Link> /{' '}
          <span className="text-slate-700">{product.ten_san_pham}</span>
        </div>

        <section className="grid gap-6 border-b border-[#d7ddd8] pb-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-[#d7ddd8] bg-white shadow-sm">
              <img src={activeImage || placeholderImage} alt={product.ten_san_pham} className="aspect-square w-full object-cover" />
            </div>

            <div className="grid grid-cols-4 gap-3 md:grid-cols-5">
              {images.map((image, index) => (
                <button
                  key={`${index}-${image.slice(0, 20)}`}
                  onClick={() => setActiveImage(image)}
                  className={`overflow-hidden rounded-[16px] border bg-white p-1 ${
                    activeImage === image ? 'border-[#2d9e63] ring-2 ring-[#e8f5ee]' : 'border-[#dce7df]'
                  }`}
                >
                  <img src={image} alt={`Ảnh ${index + 1}`} className="h-20 w-full rounded-[12px] object-cover" />
                </button>
              ))}
            </div>
          </div>

          <aside className="space-y-4 lg:py-1">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="market-pill">{product.ten_danh_muc || 'Nông sản'}</span>
                <span className="rounded-full bg-[#efeded] px-3 py-1 text-xs font-bold text-[#0f5238]">
                  Chứng nhận nguồn hàng
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-[#1b1c1c] md:text-4xl">{product.ten_san_pham}</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {product.mo_ta || 'Thông tin chi tiết của sản phẩm đang được cập nhật.'}
              </p>

              <div className="mt-5 rounded-xl bg-[#f5f3f3] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Giá bán</p>
                <p className="mt-2 text-4xl font-bold text-[#a33d23]">{formatCurrency(product.gia_ban)}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Đơn vị: {product.don_vi} · Tồn kho: {stock > 0 ? stock : 'Tạm hết'}
                </p>
              </div>

              <div className="mt-5 space-y-2 border-y border-[#d7ddd8] py-4 text-sm text-slate-600">
                <div className="flex justify-between gap-3">
                  <span>Nguồn hàng</span>
                  <span className="font-semibold text-slate-900">{product.ten_nong_trai || 'Cửa hàng Nông Sản Việt'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Khu vực</span>
                  <span className="font-semibold text-slate-900">{product.tinh_thanh || 'Toàn quốc'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Đơn vị quản lý</span>
                  <span className="font-semibold text-slate-900">{product.ten_nong_dan || 'Quản trị viên'}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-lg border border-[#d7ddd8] px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded bg-[#f5f3f3] text-slate-700"
                  >
                    -
                  </button>
                  <span className="font-semibold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => Math.min(maxQuantity, prev + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded bg-[#f5f3f3] text-slate-700"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-slate-500">Mua {quantity} {product.don_vi}</span>
              </div>

              {user?.role === 'admin' ? (
                <div className="mt-5 rounded-[18px] bg-slate-100 px-4 py-3 text-sm text-slate-500">
                  Tài khoản quản trị không dùng để mua hàng.
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={stock <= 0}
                    className={`rounded-lg px-5 py-3 text-sm font-semibold ${
                      stock <= 0
                        ? 'bg-slate-200 text-slate-500'
                        : added
                          ? 'bg-[#e8f5ee] text-[#1a7a4a]'
                          : 'bg-[#0f5238] text-white hover:bg-[#0a402b]'
                    }`}
                  >
                    {stock <= 0 ? 'Sản phẩm tạm hết' : added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={stock <= 0}
                    className={`rounded-lg border px-5 py-3 text-sm font-semibold ${
                      stock <= 0 ? 'border-slate-200 bg-slate-200 text-slate-500' : 'border-[#0f5238] bg-white text-[#0f5238] hover:bg-[#f5f3f3]'
                    }`}
                  >
                    Mua ngay
                  </button>
                </div>
              )}
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="market-panel p-6">
            <div className="market-section-title">
              <h2>Đặt trước sản phẩm</h2>
            </div>
            <form onSubmit={handlePreorder} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="number"
                  min="1"
                  value={preorderForm.quantity}
                  onChange={event => setPreorderForm({ ...preorderForm, quantity: Number(event.target.value) || 1 })}
                  className="rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
                  placeholder="Số lượng"
                />
                <input
                  type="date"
                  value={preorderForm.ngay_giao_du_kien}
                  onChange={event => setPreorderForm({ ...preorderForm, ngay_giao_du_kien: event.target.value })}
                  className="rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
                />
              </div>
              <textarea
                rows={3}
                value={preorderForm.dia_chi_giao}
                onChange={event => setPreorderForm({ ...preorderForm, dia_chi_giao: event.target.value })}
                placeholder="Địa chỉ giao hàng"
                className="w-full resize-none rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
              />
              <input
                value={preorderForm.ghi_chu}
                onChange={event => setPreorderForm({ ...preorderForm, ghi_chu: event.target.value })}
                placeholder="Ghi chú thêm"
                className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
              />
              {preorderMessage ? <p className="text-sm text-red-600">{preorderMessage}</p> : null}
              <button className="rounded-full bg-[#e85d04] px-5 py-3 text-sm font-semibold text-white hover:bg-[#cf5408]">
                {savingPreorder ? 'Đang tạo đơn...' : 'Tạo đơn đặt trước'}
              </button>
            </form>
          </div>

          <div className="market-panel p-6">
            <div className="market-section-title">
              <h2>Đăng ký giao định kỳ</h2>
            </div>
            <form onSubmit={handleSubscription} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="number"
                  min="1"
                  value={subscriptionForm.quantity}
                  onChange={event => setSubscriptionForm({ ...subscriptionForm, quantity: Number(event.target.value) || 1 })}
                  className="rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
                  placeholder="Số lượng mỗi kỳ"
                />
                <select
                  value={subscriptionForm.tan_suat_giao}
                  onChange={event => setSubscriptionForm({ ...subscriptionForm, tan_suat_giao: event.target.value })}
                  className="rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
                >
                  <option value="hang_tuan">Hàng tuần</option>
                  <option value="hai_tuan">2 tuần / lần</option>
                  <option value="hang_thang">Hàng tháng</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="number"
                  min="2"
                  value={subscriptionForm.so_ky_giao}
                  onChange={event => setSubscriptionForm({ ...subscriptionForm, so_ky_giao: Number(event.target.value) || 2 })}
                  className="rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
                  placeholder="Số kỳ giao"
                />
                <input
                  type="date"
                  value={subscriptionForm.ngay_bat_dau}
                  onChange={event => setSubscriptionForm({ ...subscriptionForm, ngay_bat_dau: event.target.value })}
                  className="rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
                />
              </div>
              <textarea
                rows={3}
                value={subscriptionForm.dia_chi_giao}
                onChange={event => setSubscriptionForm({ ...subscriptionForm, dia_chi_giao: event.target.value })}
                placeholder="Địa chỉ giao hàng"
                className="w-full resize-none rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
              />
              <input
                value={subscriptionForm.ghi_chu}
                onChange={event => setSubscriptionForm({ ...subscriptionForm, ghi_chu: event.target.value })}
                placeholder="Ghi chú thêm"
                className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
              />
              {subscriptionMessage ? <p className="text-sm text-red-600">{subscriptionMessage}</p> : null}
              <button className="rounded-full bg-[#1a7a4a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#14633b]">
                {savingSubscription ? 'Đang lưu...' : 'Đăng ký giao định kỳ'}
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="market-panel p-6">
            <div className="market-section-title">
              <h2>Đánh giá từ người mua</h2>
            </div>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <select
                value={reviewForm.so_sao}
                onChange={event => setReviewForm({ ...reviewForm, so_sao: Number(event.target.value) })}
                className="w-full rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
              >
                {[5, 4, 3, 2, 1].map(value => (
                  <option key={value} value={value}>{value} sao</option>
                ))}
              </select>
              <textarea
                rows={4}
                value={reviewForm.noi_dung}
                onChange={event => setReviewForm({ ...reviewForm, noi_dung: event.target.value })}
                placeholder="Viết cảm nhận của bạn về sản phẩm..."
                className="w-full resize-none rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
              />
              {reviewMessage ? <p className="text-sm text-slate-600">{reviewMessage}</p> : null}
              <button
                disabled={user?.role === 'admin'}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {savingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {reviews.length ? (
                reviews.map(review => <ReviewItem key={review.ma_danh_gia} review={review} />)
              ) : (
                <div className="rounded-[18px] border border-dashed border-[#dce7df] py-10 text-center text-sm text-slate-400">
                  Chưa có đánh giá nào cho sản phẩm này.
                </div>
              )}
            </div>
          </div>

          <div className="market-panel p-6">
            <div className="market-section-title">
              <h2>Sản phẩm liên quan</h2>
              <Link to="/products" className="text-sm font-semibold text-[#1a7a4a]">Xem thêm</Link>
            </div>
            <div className="space-y-3">
              {relatedProducts.length ? (
                relatedProducts.map(item => (
                  <Link
                    key={item.ma_san_pham}
                    to={`/products/${item.ma_san_pham}`}
                    className="flex gap-4 rounded-[18px] border border-[#dce7df] bg-white p-3 hover:border-[#2d9e63]"
                  >
                    <img
                      src={item.images?.[0] || placeholderImage}
                      alt={item.ten_san_pham}
                      className="h-24 w-24 rounded-[16px] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {item.ten_nong_trai || 'Cửa hàng Nông Sản Việt'}
                      </p>
                      <p className="mt-2 line-clamp-2 text-base font-semibold text-slate-900">{item.ten_san_pham}</p>
                      <p className="mt-3 text-lg font-bold text-[#1a7a4a]">{formatCurrency(item.gia_ban)}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[18px] border border-dashed border-[#dce7df] py-10 text-center text-sm text-slate-400">
                  Chưa có sản phẩm liên quan để hiển thị.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
