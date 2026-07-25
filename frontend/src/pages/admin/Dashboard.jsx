import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { dashboardAPI } from '../../services/api';
import { Badge, Btn, Loading, PageHero, SectionCard, StatCard } from '../../components/ui/AdminUI';

const statusLabelMap = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'yellow' },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'blue' },
  dang_giao: { label: 'Đang giao', color: 'purple' },
  da_giao: { label: 'Đã giao', color: 'green' },
  da_huy: { label: 'Đã hủy', color: 'red' },
};

const formatMonthLabel = thang => {
  const [y, m] = thang.split('-');
  return `Th${Number(m)}/${y}`;
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.admin().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return <div className="bg-surface rounded-3xl p-lg border border-outline-variant text-body-md text-on-surface-variant">Không tải được dữ liệu tổng quan.</div>;

  const chartData = (data.doanh_thu_theo_thang || []).map(r => ({
    thang: formatMonthLabel(r.thang),
    'Doanh thu': Number(r.doanh_thu || 0),
    'Số đơn': Number(r.so_don || 0),
  }));

  const statusData = (data.phan_bo_trang_thai || []).map(r => ({
    trang_thai: r.trang_thai,
    label: (statusLabelMap[r.trang_thai] || {}).label || r.trang_thai,
    color: (statusLabelMap[r.trang_thai] || {}).color || 'gray',
    so_luong: Number(r.so_luong || 0),
  }));

  const exportReport = async () => {
    const wb = XLSX.utils.book_new();

    const overviewRows = [
      { 'Chỉ số': 'Tổng tài khoản', 'Giá trị': data.tong_tk },
      { 'Chỉ số': 'Tổng sản phẩm đang bán', 'Giá trị': data.tong_sp },
      { 'Chỉ số': 'Tổng đơn hàng', 'Giá trị': data.tong_dh },
      { 'Chỉ số': 'Doanh thu (đã giao)', 'Giá trị': Number(data.doanh_thu || 0) },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overviewRows), 'Tong quan');

    const monthRows = (data.doanh_thu_theo_thang || []).map(r => ({
      'Tháng': r.thang,
      'Doanh thu': Number(r.doanh_thu || 0),
      'Số đơn': Number(r.so_don || 0),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthRows.length ? monthRows : [{ 'Thông báo': 'Không có dữ liệu' }]), 'Doanh thu theo thang');

    const statusRows = statusData.map(s => ({ 'Trạng thái': s.label, 'Số lượng đơn': s.so_luong }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statusRows.length ? statusRows : [{ 'Thông báo': 'Không có dữ liệu' }]), 'Trang thai don hang');

    const topSpRows = (data.top_sp || []).map((p, i) => ({
      'STT': i + 1,
      'Sản phẩm': p.ten_san_pham,
      'Giá bán': Number(p.gia_ban || 0),
      'Đã bán': Number(p.so_luong_ban || 0),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topSpRows.length ? topSpRows : [{ 'Thông báo': 'Không có dữ liệu' }]), 'San pham ban chay');

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const fileName = `bao_cao_tong_quan_${dd}-${mm}-${yyyy}.xlsx`;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Excel file', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
        });
        const bin = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([bin], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (e) {
        if (e.name !== 'AbortError') alert('Không thể lưu file.');
      }
    } else {
      XLSX.writeFile(wb, fileName);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Admin dashboard"
        title="Toàn cảnh hệ thống quản lý tập trung"
        body="Khu vực này tổng hợp nhanh tài khoản, sản phẩm, đơn hàng, doanh thu và các dữ liệu mới nhất đang phát sinh trên hệ thống."
        actions={
          <Btn variant="outline" onClick={exportReport}>
            <span className="material-symbols-outlined text-sm mr-1">download</span> Xuất báo cáo
          </Btn>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<span className="material-symbols-outlined">person</span>} label="Tài khoản" value={data.tong_tk || 0} color="blue" />
        <StatCard icon={<span className="material-symbols-outlined">inventory_2</span>} label="Sản phẩm" value={data.tong_sp || 0} color="green" />
        <StatCard icon={<span className="material-symbols-outlined">receipt_long</span>} label="Đơn hàng" value={data.tong_dh || 0} color="orange" />
        <StatCard icon={<span className="material-symbols-outlined">payments</span>} label="Doanh thu" value={`${Number(data.doanh_thu || 0).toLocaleString('vi-VN')}₫`} color="purple" />
      </div>

      <SectionCard title="Doanh thu theo tháng (6 tháng gần nhất)">
        {chartData.length ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="thang" />
                <YAxis yAxisId="left" tickFormatter={v => `${(v / 1000).toLocaleString('vi-VN')}k`} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                <Tooltip formatter={(value, name) => name === 'Doanh thu' ? `${Number(value).toLocaleString('vi-VN')}₫` : value} />
                <Legend />
                <Bar yAxisId="left" dataKey="Doanh thu" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={22} />
                <Bar yAxisId="right" dataKey="Số đơn" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-body-md text-on-surface-variant">Chưa có dữ liệu doanh thu.</p>
        )}
      </SectionCard>

      <SectionCard title="Phân bố đơn hàng theo trạng thái">
        {statusData.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {statusData.map(s => (
              <div key={s.trang_thai} className="rounded-2xl bg-surface-container-low p-4 text-center">
                <Badge text={s.label} color={s.color} />
                <p className="mt-2 text-headline-lg font-headline-lg text-on-surface">{s.so_luong}</p>
                <p className="text-label-sm text-on-surface-variant">đơn hàng</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-body-md text-on-surface-variant">Chưa có dữ liệu.</p>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Đơn hàng gần đây" action={<Link to="/admin/orders" className="text-label-sm font-bold text-primary hover:text-on-primary-fixed-variant">Xem tiếp</Link>}>
          <div className="space-y-3">
            {(data.gan_day || []).length ? data.gan_day.map(order => (
              <div key={order.ma_don_hang} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low px-4 py-3">
                <div>
                  <p className="text-title-md font-title-md text-on-surface">#{order.ma_don_hang} · {order.ten_nguoi_mua}</p>
                  <p className="mt-1 text-label-sm text-on-surface-variant">{new Date(order.ngay_tao).toLocaleDateString('vi-VN')}</p>
                </div>
                <Badge text={(statusLabelMap[order.trang_thai] || {}).label || order.trang_thai} color={(statusLabelMap[order.trang_thai] || {}).color || 'yellow'} />
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