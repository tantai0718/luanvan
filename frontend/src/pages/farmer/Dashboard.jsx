import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, productAPI } from '../../services/api';
import { Badge, Loading, StatCard } from '../../components/ui/AdminUI';

function TopProductList({ products }) {
  if (!products.length) {
    return <div className="py-10 text-center text-sm text-gray-400">Chưa có sản phẩm nào</div>;
  }

  return (
    <div className="divide-y divide-gray-50">
      {products.map((product, index) => {
        const isLowStock = Number(product.ton_kho) <= Number(product.ton_kho_toi_thieu);

        return (
          <div key={`${product.ten_san_pham}-${index}`} className="flex items-center gap-3 px-5 py-3">
            <span className="w-6 shrink-0 text-center text-lg font-bold text-gray-300">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800">{product.ten_san_pham}</p>
              <p className="text-xs text-gray-400">Đã bán {product.so_luong_ban || 0} · Tồn {product.ton_kho || 0}</p>
            </div>
            <Badge text={isLowStock ? 'Sắp hết' : 'Ổn định'} color={isLowStock ? 'orange' : 'green'} />
          </div>
        );
      })}
    </div>
  );
}

function LowStockList({ products }) {
  if (!products.length) {
    return <div className="py-10 text-center text-sm text-gray-400">Không có sản phẩm sắp hết hàng</div>;
  }

  return (
    <div className="divide-y divide-gray-50">
      {products.map(product => (
        <div key={product.ma_san_pham} className="flex items-center gap-3 px-5 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">⚠️</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800">{product.ten_san_pham}</p>
            <p className="text-xs text-gray-400">Tồn {product.ton_kho} / Mức tối thiểu {product.ton_kho_toi_thieu}</p>
          </div>
          <Badge text="Cần xử lý" color="red" />
        </div>
      ))}
    </div>
  );
}

export default function FarmerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardAPI.farmer(), productAPI.lowStock()])
      .then(([dashboardData, lowStockData]) => {
        setDashboard(dashboardData);
        setLowStockProducts(lowStockData.products || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    if (!dashboard) return [];

    return [
      { icon: '📦', label: 'Tổng đơn hàng', value: dashboard.tong_don || 0, color: 'blue' },
      { icon: '💰', label: 'Doanh thu', value: `${Number(dashboard.doanh_thu || 0).toLocaleString('vi-VN')}₫`, color: 'green' },
      { icon: '🥬', label: 'Sản phẩm nổi bật', value: dashboard.san_pham?.length || 0, color: 'orange' },
      { icon: '⚠️', label: 'Sắp hết hàng', value: lowStockProducts.length, color: lowStockProducts.length ? 'red' : 'purple' },
    ];
  }, [dashboard, lowStockProducts]);

  if (loading) return <Loading />;
  if (!dashboard) return <p className="text-sm text-gray-500">Không tải được dữ liệu</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tổng quan nông dân</h1>
            <p className="mt-1 text-sm text-gray-500">Theo dõi đơn hàng, doanh thu và tình trạng tồn kho của gian hàng.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/farmer/products" className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700">
              Quản lý sản phẩm
            </Link>
            <Link to="/farmer/orders" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              Xem đơn hàng
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-700">Sản phẩm bán chạy</h2>
              <Link to="/farmer/products" className="text-xs font-medium text-green-600 hover:underline">Quản lý →</Link>
            </div>
            <TopProductList products={dashboard.san_pham || []} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-700">Cảnh báo tồn kho</h2>
              <Link to="/farmer/products" className="text-xs font-medium text-green-600 hover:underline">Cập nhật →</Link>
            </div>
            <LowStockList products={lowStockProducts} />
          </div>
        </div>
      </div>
    </div>
  );
}
