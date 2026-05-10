import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { orderAPI, productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const currency = value => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

function Stars({ value }) {
  const rounded = Math.round(Number(value || 0));
  return (
    <div className="flex items-center gap-1 text-yellow-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < rounded ? 'opacity-100' : 'opacity-25'}>★</span>
      ))}
    </div>
  );
}

function ReviewForm({ disabled, canReview, hasReviewed, reviewForm, setReviewForm, onSubmit, saving }) {
  if (disabled) return null;

  return (
    <div className="rounded-[32px] border border-stone-200 bg-white p-6">
      <h3 className="text-xl font-bold text-stone-900">Viết đánh giá</h3>
      {!canReview ? (
        <p className="mt-3 text-sm text-stone-500">Bạn cần có đơn hàng đã giao chứa sản phẩm này để gửi đánh giá.</p>
      ) : hasReviewed ? (
        <p className="mt-3 text-sm text-stone-500">Bạn đã đánh giá sản phẩm này rồi. Cảm ơn bạn đã chia sẻ trải nghiệm.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">Số sao</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewForm(prev => ({ ...prev, so_sao: star }))}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    reviewForm.so_sao >= star ? 'bg-yellow-100 text-yellow-700' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {star} ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">Nhận xét</label>
            <textarea
              rows={4}
              value={reviewForm.noi_dung}
              onChange={event => setReviewForm(prev => ({ ...prev, noi_dung: event.target.value }))}
              placeholder="Chia sẻ cảm nhận về chất lượng sản phẩm, độ tươi và trải nghiệm nhận hàng..."
              className="w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <button type="submit" disabled={saving} className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
            {saving ? 'Đang gửi đánh giá...' : 'Gửi đánh giá'}
          </button>
        </form>
      )}
    </div>
  );
}

function ReviewList({ reviews }) {
  if (!reviews.length) {
    return <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-stone-400">Chưa có đánh giá nào cho sản phẩm này.</div>;
  }

  return (
    <div className="space-y-3">
      {reviews.map(review => (
        <div key={review.ma_danh_gia} className="rounded-3xl border border-stone-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-stone-900">{review.ten_nguoi_mua}</p>
              <p className="mt-1 text-xs text-stone-400">{new Date(review.ngay_tao).toLocaleDateString('vi-VN')}</p>
            </div>
            <Stars value={review.so_sao} />
          </div>
          <p className="mt-3 text-sm leading-7 text-stone-600">{review.noi_dung || 'Khách hàng chưa để lại nhận xét.'}</p>
        </div>
      ))}
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
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ so_sao: 5, noi_dung: '' });
  const [eligibleOrderId, setEligibleOrderId] = useState(null);
  const [checkingReview, setCheckingReview] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError('');

    Promise.all([productAPI.getById(id), productAPI.getReviews(id)])
      .then(([productData, reviewData]) => {
        const nextProduct = productData.product;
        setProduct(nextProduct);
        setReviews(reviewData.reviews || []);
        setActiveImage(nextProduct.images?.[0] || 'https://placehold.co/800x600/f1f5f2/2f5d50?text=Nong+san');
      })
      .catch(err => setError(err.message || 'Không tải được sản phẩm'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== 'buyer' || !product) return;

    setCheckingReview(true);
    orderAPI
      .getAll()
      .then(async data => {
        const deliveredOrders = (data.orders || []).filter(order => order.trang_thai === 'da_giao');
        const details = await Promise.all(deliveredOrders.map(order => orderAPI.getById(order.ma_don_hang)));
        const matched = details.find(detail =>
          detail.items?.some(item => String(item.ma_san_pham) === String(product.ma_san_pham))
        );
        setEligibleOrderId(matched?.order?.ma_don_hang || null);
      })
      .catch(() => setEligibleOrderId(null))
      .finally(() => setCheckingReview(false));
  }, [product, user]);

  useEffect(() => {
    if (!product?.ma_danh_muc) return;
    productAPI
      .getAll(`?category=${product.ma_danh_muc}&limit=4`)
      .then(data => {
        const list = (data.products || []).filter(item => String(item.ma_san_pham) !== String(product.ma_san_pham));
        setRelatedProducts(list.slice(0, 3));
      })
      .catch(() => setRelatedProducts([]));
  }, [product]);

  const stock = Number(product?.ton_kho || 0);
  const maxQuantity = Math.max(1, stock || 1);
  const hasReviewed = reviews.some(review => String(review.ma_nguoi_mua) === String(user?.id));

  useEffect(() => {
    if (quantity > maxQuantity) setQuantity(maxQuantity);
  }, [maxQuantity, quantity]);

  const images = useMemo(() => {
    if (!product) return [];
    return product.images?.length ? product.images : ['https://placehold.co/800x600/f1f5f2/2f5d50?text=Nong+san'];
  }, [product]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer' || stock <= 0) return;

    try {
      await addToCart(product.ma_san_pham, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
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
    if (!eligibleOrderId) return;

    setSavingReview(true);
    setReviewMessage('');

    try {
      await productAPI.createReview({
        ma_san_pham: product.ma_san_pham,
        ma_don_hang: eligibleOrderId,
        so_sao: reviewForm.so_sao,
        noi_dung: reviewForm.noi_dung,
      });
      const reviewData = await productAPI.getReviews(id);
      setReviews(reviewData.reviews || []);
      setReviewForm({ so_sao: 5, noi_dung: '' });
      setReviewMessage('Đánh giá của bạn đã được ghi nhận.');
    } catch (err) {
      setReviewMessage(err.message || 'Không thể gửi đánh giá');
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-stone-50"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent" /></div>;
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-stone-800">{error || 'Không tìm thấy sản phẩm'}</p>
          <Link to="/products" className="mt-4 inline-block rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-stone-400">
          <Link to="/" className="hover:text-emerald-700">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-emerald-700">Sản phẩm</Link>
          <span>/</span>
          <span className="text-stone-600">{product.ten_san_pham}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[32px] border border-stone-200 bg-white">
              <img src={activeImage} alt={product.ten_san_pham} className="h-[420px] w-full object-cover" />
            </div>

            <div className="grid grid-cols-4 gap-3 md:grid-cols-5">
              {images.map((image, index) => (
                <button key={`${index}-${image.slice(0, 24)}`} onClick={() => setActiveImage(image)} className={`overflow-hidden rounded-2xl border bg-white ${activeImage === image ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-stone-200'}`}>
                  <img src={image} alt={`${product.ten_san_pham} ${index + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[32px] border border-stone-200 bg-white p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">{product.bieu_tuong} {product.ten_danh_muc}</span>
                {product.da_xac_minh ? <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Nông trại đã xác minh</span> : null}
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight text-stone-900">{product.ten_san_pham}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Stars value={product.diem_danh_gia} />
                <p className="text-sm text-stone-500">{Number(product.diem_danh_gia || 0).toFixed(1)} / 5 · {product.tong_danh_gia || 0} đánh giá</p>
              </div>

              <div className="mt-6 border-y border-stone-100 py-5">
                <p className="text-3xl font-bold text-emerald-800">{currency(product.gia_ban)}</p>
                <p className="mt-1 text-sm text-stone-500">Đơn vị bán: {product.don_vi}</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-stone-50 px-4 py-3"><p className="text-xs uppercase tracking-[0.16em] text-stone-400">Nông trại</p><p className="mt-1 font-semibold text-stone-800">{product.ten_nong_trai}</p></div>
                <div className="rounded-2xl bg-stone-50 px-4 py-3"><p className="text-xs uppercase tracking-[0.16em] text-stone-400">Khu vực</p><p className="mt-1 font-semibold text-stone-800">{product.tinh_thanh || 'Đang cập nhật'}</p></div>
                <div className="rounded-2xl bg-stone-50 px-4 py-3"><p className="text-xs uppercase tracking-[0.16em] text-stone-400">Tồn kho</p><p className={`mt-1 font-semibold ${stock <= Number(product.ton_kho_toi_thieu || 0) ? 'text-orange-600' : 'text-stone-800'}`}>{stock > 0 ? `${stock} ${product.don_vi}` : 'Hết hàng'}</p></div>
                <div className="rounded-2xl bg-stone-50 px-4 py-3"><p className="text-xs uppercase tracking-[0.16em] text-stone-400">Người phụ trách</p><p className="mt-1 font-semibold text-stone-800">{product.ten_nong_dan}</p></div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 px-2 py-2">
                  <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-stone-600 hover:bg-white">-</button>
                  <span className="w-12 text-center font-semibold text-stone-800">{quantity}</span>
                  <button onClick={() => setQuantity(prev => Math.min(maxQuantity, prev + 1))} className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-stone-600 hover:bg-white">+</button>
                </div>

                {user?.role === 'buyer' || !user ? (
                  <>
                    <button onClick={handleAddToCart} disabled={stock <= 0} className={`flex-1 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${stock <= 0 ? 'bg-stone-200 text-stone-500' : added ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}>
                      {stock <= 0 ? 'Sản phẩm đã hết hàng' : added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
                    </button>
                    <button onClick={handleBuyNow} disabled={stock <= 0} className={`flex-1 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${stock <= 0 ? 'bg-stone-200 text-stone-500' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
                      Mua ngay
                    </button>
                  </>
                ) : (
                  <div className="flex-1 rounded-full bg-stone-100 px-6 py-3 text-center text-sm font-medium text-stone-500">Tài khoản này không dùng để mua hàng</div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-stone-200 bg-white p-6">
              <h2 className="text-xl font-bold text-stone-900">Mô tả sản phẩm</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-8 text-stone-600">{product.mo_ta || 'Nhà bán chưa cập nhật mô tả chi tiết cho sản phẩm này.'}</p>
            </div>

            <div className="rounded-[32px] border border-stone-200 bg-white p-6">
              <h2 className="text-xl font-bold text-stone-900">Thông tin nông trại</h2>
              <p className="mt-3 text-sm leading-8 text-stone-600">{product.gioi_thieu || 'Nông trại đang bổ sung phần giới thiệu.'}</p>
              <div className="mt-4 text-sm text-stone-500">Liên hệ: {product.sdt_nd || 'Đang cập nhật'}</div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ReviewForm
            disabled={user?.role && user.role !== 'buyer'}
            canReview={Boolean(eligibleOrderId)}
            hasReviewed={hasReviewed}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            onSubmit={handleReviewSubmit}
            saving={savingReview || checkingReview}
          />

          <div>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Đánh giá</p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-stone-900">Nhận xét từ người mua</h2>
              {reviewMessage && <p className={`mt-3 text-sm ${reviewMessage.includes('Không') ? 'text-red-600' : 'text-emerald-700'}`}>{reviewMessage}</p>}
            </div>
            <ReviewList reviews={reviews} />
          </div>
        </div>

        {!!relatedProducts.length && (
          <div className="mt-12">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Gợi ý thêm</p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-stone-900">Sản phẩm liên quan</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedProducts.map(item => (
                <Link key={item.ma_san_pham} to={`/products/${item.ma_san_pham}`} className="overflow-hidden rounded-3xl border border-stone-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg">
                  <img src={item.images?.[0] || 'https://placehold.co/600x420/f1f5f2/2f5d50?text=Nong+san'} alt={item.ten_san_pham} className="h-44 w-full object-cover" />
                  <div className="p-4">
                    <p className="text-xs text-stone-400">{item.ten_nong_trai}</p>
                    <p className="mt-1 line-clamp-2 font-semibold text-stone-900">{item.ten_san_pham}</p>
                    <p className="mt-3 text-lg font-bold text-emerald-800">{currency(item.gia_ban)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
