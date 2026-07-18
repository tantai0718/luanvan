import { useEffect, useState } from "react";
import { reviewAPI } from "../../services/api";
import {
  Badge,
  Btn,
  Loading,
  Modal,
  PageHero,
  SearchBar,
  Select,
  StatCard,
} from "../../components/ui/AdminUI";

function ReplyModal({ review, onClose, onDone }) {
  const [content, setContent] = useState(review.phan_hoi || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const productImg = review.hinh_san_pham
    ? `http://localhost:5000${review.hinh_san_pham}`
    : "https://placehold.co/100x100/b1f0ce/0f5238?text=NS";

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await reviewAPI.reply(review.madg, { phan_hoi: content });
      onDone();
    } catch (err) {
      setError(err.message || "Không gửi được phản hồi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Phản hồi đánh giá" onClose={onClose}>
      <div className="mb-4 flex gap-3 rounded-2xl bg-surface-container-low p-4">
        <img
          src={productImg}
          alt={review.ten_san_pham}
          className="h-14 w-14 shrink-0 rounded-xl object-cover border border-outline-variant"
        />
        <div className="min-w-0">
          <p className="text-label-sm font-bold text-on-surface truncate">
            {review.ten_nguoi_mua || "Khách hàng"} — {review.ten_san_pham}
          </p>
          <p className="mt-1 text-secondary text-sm">
            {"★".repeat(review.so_sao)}
            {"☆".repeat(5 - review.so_sao)}
          </p>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {review.noi_dung || "Không có nhận xét."}
          </p>
        </div>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập phản hồi gửi tới khách hàng..."
          className="w-full resize-none rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed"
        />
        {error && (
          <div className="rounded-2xl border border-error-container bg-error-container/20 px-4 py-3 text-body-md text-on-error-container">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <Btn className="flex-1 justify-center" disabled={saving}>
            {saving ? "Đang gửi..." : "Gửi phản hồi"}
          </Btn>
          <Btn
            type="button"
            variant="outline"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Đóng
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function ReviewRow({ review, onReply }) {
  const productImg = review.hinh_san_pham
    ? `http://localhost:5000${review.hinh_san_pham}`
    : "https://placehold.co/100x100/b1f0ce/0f5238?text=NS";

  return (
    <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
      <div className="flex items-start gap-3">
        <img
          src={productImg}
          alt={review.ten_san_pham}
          className="h-14 w-14 shrink-0 rounded-xl object-cover border border-outline-variant"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-title-md font-title-md text-on-surface">
                {review.ten_nguoi_mua || "Khách hàng"}
              </p>
              <p className="text-label-sm text-on-surface-variant truncate">
                {review.ten_san_pham}
              </p>
            </div>
            <Badge
              text={review.phan_hoi ? "Đã phản hồi" : "Chưa phản hồi"}
              color={review.phan_hoi ? "green" : "orange"}
            />
          </div>
          <p className="mt-2 text-secondary text-sm">
            {"★".repeat(review.so_sao)}
            {"☆".repeat(5 - review.so_sao)}
          </p>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {review.noi_dung || "Không có nhận xét."}
          </p>
          <p className="mt-1 text-label-xs text-on-surface-variant">
            {review.ngay_tao
              ? new Date(review.ngay_tao).toLocaleDateString("vi-VN")
              : ""}
          </p>

          {review.phan_hoi && (
            <div className="mt-3 rounded-2xl bg-primary-fixed/40 p-3">
              <p className="text-label-xs font-bold text-primary">
                Phản hồi của cửa hàng
              </p>
              <p className="mt-1 text-body-md text-on-surface">
                {review.phan_hoi}
              </p>
            </div>
          )}

          <div className="mt-4">
            <Btn size="sm" variant="outline" onClick={() => onReply(review)}>
              {review.phan_hoi ? "Sửa phản hồi" : "Phản hồi"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [star, setStar] = useState("");
  const [replied, setReplied] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (star) params.set("star", star);
      if (replied) params.set("replied", replied);
      const data = await reviewAPI.adminAll(`?${params.toString()}`);
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
    } catch {
      setReviews([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, star, replied]);

  const summary = {
    total,
    replied: reviews.filter((r) => r.phan_hoi).length,
    pending: reviews.filter((r) => !r.phan_hoi).length,
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Đánh giá"
        title="Quản lý đánh giá khách hàng"
        body="Xem và phản hồi các đánh giá sản phẩm từ khách hàng."
      />

      <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo sản phẩm, khách hàng, nội dung..."
          />
          <Select value={star} onChange={(e) => setStar(e.target.value)}>
            <option value="">Tất cả số sao</option>
            {[5, 4, 3, 2, 1].map((s) => (
              <option key={s} value={s}>
                {s} sao
              </option>
            ))}
          </Select>
          <Select value={replied} onChange={(e) => setReplied(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="1">Đã phản hồi</option>
            <option value="0">Chưa phản hồi</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<span className="material-symbols-outlined">reviews</span>}
          label="Tổng đánh giá"
          value={summary.total}
          color="green"
        />
        <StatCard
          icon={<span className="material-symbols-outlined">check_circle</span>}
          label="Đã phản hồi"
          value={summary.replied}
          color="blue"
        />
        <StatCard
          icon={<span className="material-symbols-outlined">pending</span>}
          label="Chưa phản hồi"
          value={summary.pending}
          color="orange"
        />
      </div>

      {loading ? (
        <Loading />
      ) : reviews.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reviews.map((review) => (
            <ReviewRow
              key={review.madg}
              review={review}
              onReply={setReplyTarget}
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-3xl py-16 text-center border border-dashed border-outline-variant">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">
            reviews
          </span>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Chưa có đánh giá nào.
          </p>
        </div>
      )}

      {replyTarget && (
        <ReplyModal
          review={replyTarget}
          onClose={() => setReplyTarget(null)}
          onDone={() => {
            setReplyTarget(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
