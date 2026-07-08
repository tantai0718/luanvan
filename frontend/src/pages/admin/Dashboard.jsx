import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { Badge, Loading, PageHero, SectionCard, StatCard } from '../../components/ui/AdminUI';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.admin().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return <div className="bg-surface rounded-3xl p-lg border border-outline-variant text-body-md text-on-surface-variant">Không tải được dữ liệu tổng quan.</div>;

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Admin dashboard" title="Toàn cảnh hệ thống quản lý tập trung" body="Khu vực này tổng hợp nhanh tài khoản, sản phẩm, đơn hàng, doanh thu và các dữ liệu mới nhất đang phát sinh trên hệ thống." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<span className="material-symbols-outlined">person</span>} label="Tài khoản" value={data.tong_tk || 0} color="blue" />
        <StatCard icon={<span className="material-symbols-outlined">inventory_2</span>} label="Sản phẩm" value={data.tong_sp || 0} color="green" />
        <StatCard icon={<span className="material-symbols-outlined">receipt_long</span>} label="Đơn hàng" value={data.tong_dh || 0} color="orange" />
        <StatCard icon={<span className="material-symbols-outlined">payments</span>} label="Doanh thu" value={`${Number(data.doanh_thu || 0).toLocaleString('vi-VN')}₫`} color="purple" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Đơn hàng gần đây" action={<Link to="/admin/orders" className="text-label-sm font-bold text-primary hover:text-on-primary-fixed-variant">Xem tiếp</Link>}>
          <div className="space-y-3">
            {(data.gan_day || []).length ? data.gan_day.map(order => (
              <div key={order.ma_don_hang} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low px-4 py-3">
                <div>
                  <p className="text-title-md font-title-md text-on-surface">#{order.ma_don_hang} · {order.ten_nguoi_mua}</p>
                  <p className="mt-1 text-label-sm text-on-surface-variant">{new Date(order.ngay_tao).toLocaleDateString('vi-VN')}</p>
                </div>
                <Badge text={order.trang_thai} color="yellow" />
              </div>
            )) : <p className="py-8 text-center text-body-md text-on-surface-variant">Chưa có đơn hàng gần đây.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Sản phẩm bán nhiều" action={<Link to="/admin/products" className="text-label-sm font-bold text-primary hover:text-on-primary-fixed-variant">Xem tiếp</Link>}>
          <div className="space-y-3">
            {(data.top_sp || []).length ? data.top_sp.map((product, index) => (
              <div key={`${product.ten_san_pham}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low px-4 py-3">
                <div>
                  <p className="text-title-md font-title-md text-on-surface">{product.ten_san_pham}</p>
                  <p className="mt-1 text-label-sm text-on-surface-variant">{Number(product.gia_ban || 0).toLocaleString('vi-VN')}₫</p>
                </div>
                <Badge text={`${product.so_luong_ban} đã bán`} color="orange" />
              </div>
            )) : <p className="py-8 text-center text-body-md text-on-surface-variant">Chưa có dữ liệu sản phẩm.</p>}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
