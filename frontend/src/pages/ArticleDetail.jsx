import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { baiVietAPI } from '../services/api';

const theLoaiLabel = { quy_trinh: 'Quy trình', suc_khoe: 'Sức khỏe', am_thuc: 'Ẩm thực', kinh_nghiem: 'Kinh nghiệm', khac: 'Khác' };
const theLoaiColor = { quy_trinh: 'bg-emerald-50 text-emerald-700', suc_khoe: 'bg-blue-50 text-blue-700', am_thuc: 'bg-orange-50 text-orange-700', kinh_nghiem: 'bg-purple-50 text-purple-700', khac: 'bg-gray-50 text-gray-700' };

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ArticleDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    baiVietAPI.getById(id).then(setItem).catch(err => setError(err.message || 'Không tìm thấy bài viết')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-body-lg text-error">{error}</p></div>;
  if (!item) return null;

  return (
    <div className="bg-background min-h-screen py-xl">
      <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-xl">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <Link to="/articles" className="hover:text-primary transition-colors">Bài viết</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface font-medium line-clamp-1">{item.tieu_de}</span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-lg">
          <span className={`px-3 py-1 rounded-full text-label-sm font-bold ${theLoaiColor[item.the_loai] || theLoaiColor.khac}`}>{theLoaiLabel[item.the_loai] || 'Khác'}</span>
          <span className="text-label-sm text-on-surface-variant">{formatDate(item.ngay_dang)}</span>
          <span className="text-label-sm text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-base">visibility</span>{item.luot_xem} lượt xem</span>
        </div>

        {/* Title */}
        <h1 className="text-display-sm font-display-sm text-on-surface mb-lg">{item.tieu_de}</h1>

        {item.tom_tat && <p className="text-body-lg text-on-surface-variant mb-xl italic border-l-4 border-primary pl-4">{item.tom_tat}</p>}

        {/* Image */}
        {item.hinh_anh && <div className="rounded-3xl overflow-hidden mb-xl"><img src={item.hinh_anh} alt={item.tieu_de} className="w-full object-cover max-h-[480px]" /></div>}

        {/* Content */}
        <article className="prose prose-lg max-w-none text-on-surface
          prose-headings:text-on-surface prose-headings:font-title-md
          prose-h2:text-title-lg prose-h2:mt-xl prose-h2:mb-lg
          prose-h3:text-title-md prose-h3:mt-lg prose-h3:mb-md
          prose-p:text-body-md prose-p:text-on-surface-variant prose-p:leading-relaxed
          prose-li:text-body-md prose-li:text-on-surface-variant
          prose-strong:text-on-surface
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: item.noi_dung }}
        />

        {/* Back */}
        <div className="mt-xl pt-lg border-t border-outline-variant">
          <Link to="/articles" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
            <span className="material-symbols-outlined">arrow_back</span>Quay lại danh sách bài viết
          </Link>
        </div>
      </div>
    </div>
  );
}
