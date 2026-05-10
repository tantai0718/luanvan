import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { Badge, Loading, StatCard } from '../../components/ui/AdminUI';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.admin().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return <p className="text-sm text-gray-500">Không tải được dữ liệu</p>;

  const cards = [
    { icon: '👥', label: 'Tổng tài khoản', value: data.tong_tk, color: 'blue' },
    { icon: '🌾', label: 'Nông dân xác minh', value: data.tong_nd, color: 'green' },
    { icon: '🛒', label: 'Tổng đơn hàng', value: data.tong_dh, color: 'orange' },
    { icon: '💰', label: 'Doanh thu', value: `${Number(data.doanh_thu || 0).toLocaleString('vi-VN')}₫`, color: 'purple' },
  ];

  const quickLinks = [
    { to: '/admin/orders', icon: '🛒', label: 'Quản lý đơn hàng' },
    { to: '/admin/warehouse', icon: '🏭', label: 'Quản lý kho' },
    { to: '/admin/accounts', icon: '👥', label: 'Quản lý tài khoản' },
    { to: '/admin/categories', icon: '📂', label: 'Danh mục' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(card => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-700">🌾 Nông dân chờ duyệt</h3>
            <Link to="/admin/farmers" className="text-xs font-medium text-green-600 hover:underline">Xem tất cả →</Link>
          </div>
          {!data.cho_duyet?.length ? (
            <div className="py-10 text-center text-sm text-gray-400">Không có hồ sơ chờ duyệt</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.cho_duyet.map((farmer, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                    {farmer.ho_ten?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{farmer.ho_ten}</p>
                    <p className="truncate text-xs text-gray-400">{farmer.ten_nong_trai} · {farmer.email}</p>
                  </div>
                  <Badge text="Chờ duyệt" color="yellow" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-700">🔥 Sản phẩm bán chạy</h3>
            <Link to="/admin/products" className="text-xs font-medium text-green-600 hover:underline">Xem tất cả →</Link>
          </div>
          {!data.top_sp?.length ? (
            <div className="py-10 text-center text-sm text-gray-400">Chưa có dữ liệu</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.top_sp.map((product, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 shrink-0 text-center text-lg font-bold text-gray-300">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{product.ten_san_pham}</p>
                    <p className="text-xs text-gray-400">{Number(product.gia_ban).toLocaleString('vi-VN')}₫</p>
                  </div>
                  <Badge text={`${product.so_luong_ban} đã bán`} color="orange" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickLinks.map(link => (
          <Link key={link.to} to={link.to} className="group rounded-2xl border border-gray-100 bg-white p-4 text-center transition-all hover:border-green-200 hover:shadow-md">
            <div className="mb-2 text-3xl">{link.icon}</div>
            <p className="text-sm font-medium text-gray-700 transition-colors group-hover:text-green-700">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
