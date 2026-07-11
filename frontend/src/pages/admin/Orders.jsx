import { useEffect, useState } from 'react';
import { api, orderAPI, subscriptionAPI } from '../../services/api';
import { Badge, Btn, Loading, Modal, PageHero, Pagination, SearchBar, Table } from '../../components/ui/AdminUI';
import { pickProductImage } from '../../utils/marketImages';

const statusMap = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'yellow' },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'blue' },
  dang_giao: { label: 'Đang giao', color: 'purple' },
  da_giao: { label: 'Đã giao', color: 'green' },
  da_huy: { label: 'Đã hủy', color: 'red' },
};

const nextStatusMap = { cho_xac_nhan: 'da_xac_nhan', da_xac_nhan: 'dang_giao', dang_giao: 'da_giao' };

const orderTypeMap = {
  thuong: { label: 'Đơn thường', color: 'gray' },
  dat_truoc: { label: 'Đặt trước', color: 'orange' },
};

const subscriptionStatusMap = {
  dang_hoat_dong: { label: 'Đang hoạt động', color: 'green' },
  tam_dung: { label: 'Tạm dừng', color: 'yellow' },
  da_huy: { label: 'Đã hủy', color: 'red' },
  hoan_tat: { label: 'Hoàn tất', color: 'gray' },
};

const frequencyMap = { hang_tuan: 'Hàng tuần', hai_tuan: '2 tuần / lần', hang_thang: 'Hàng tháng' };

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const paymentMethodLabel = method => {
  if (method === 'tien_mat' || method === 'cod') return { label: 'Tiền mặt (COD)', color: 'orange' };
  if (method === 'banking') return { label: 'Chuyển khoản', color: 'blue' };
  return { label: method || 'Chưa xác định', color: 'gray' };
};


function OrderDetailModal({ detail, orderId, onClose, onAdvanceStatus, onCancel, onConfirmBankingPayment }) {
  const nextStatus = nextStatusMap[detail.order.trang_thai];
  const canCancel = ['cho_xac_nhan', 'da_xac_nhan'].includes(detail.order.trang_thai);
  const orderType = orderTypeMap[detail.order.loai_don || 'thuong'] || orderTypeMap.thuong;
  const payMethod = paymentMethodLabel(detail.order.phuong_thuc_tt);
  const isBanking = detail.order.phuong_thuc_tt === 'banking';
  const isUnpaidBanking = isBanking && detail.order.trang_thai_tt !== 'da_tt';

  return (
    <Modal title={`HÓA ĐƠN CHI TIẾT`} onClose={onClose} size="lg">
      <div className="bg-white px-6 py-4 text-slate-800 antialiased font-sans">

  
        <div className="text-center space-y-2 pb-6 border-b-2 border-slate-900">
          <h2 className="text-3xl font-black tracking-wider text-slate-900 uppercase">MÃ ĐƠN HÀNG: #{orderId}</h2>
          <p className="text-base text-slate-500 font-medium">
            Ngày đặt: {new Date(detail.order.ngay_tao).toLocaleString('vi-VN')}
          </p>
          <div className="flex justify-center gap-3 pt-2 scale-110 origin-center">
            <Badge text={statusMap[detail.order.trang_thai].label} color={statusMap[detail.order.trang_thai].color} />
            <Badge text={detail.order.trang_thai_tt === 'da_tt' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'} color={detail.order.trang_thai_tt === 'da_tt' ? 'green' : 'yellow'} />
            <Badge text={orderType.label} color={orderType.color} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-8 text-base border-b border-slate-200">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Khách hàng nhận</h3>
            <p className="text-xl font-extrabold text-slate-900">{detail.order.ten_nguoi_nhan || detail.order.ho_ten || 'Chưa cập nhật'}</p>
            <p className="text-slate-600 font-medium">SĐT: <a href={`tel:${detail.order.sdt_nguoi_nhan}`} className="text-primary hover:underline font-bold text-lg">{detail.order.sdt_nguoi_nhan || 'Chưa cập nhật'}</a></p>
            <p className="text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Địa chỉ:</span> {detail.order.dia_chi_giao || 'Chưa cập nhật'}</p>
          </div>

          <div className="space-y-3 md:text-right md:flex md:flex-col md:items-end justify-start">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Phương thức & Lịch trình</h3>
            <div className="mt-1 flex items-center gap-2 md:justify-end">
              <span className="text-slate-500 font-medium">Thanh toán:</span>
              <span className="scale-105 origin-right"><Badge text={payMethod.label} color={payMethod.color} /></span>
            </div>
            <p className="text-slate-600 font-medium">Ngày giao dự kiến: <span className="font-extrabold text-slate-900 text-lg">{detail.order.ngay_giao_du_kien ? new Date(detail.order.ngay_giao_du_kien).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</span></p>
            {detail.order.ngay_giao_thuc_te && (
              <p className="text-slate-600 font-medium">Thực tế: <span className="font-extrabold text-green-700 text-lg">{new Date(detail.order.ngay_giao_thuc_te).toLocaleString('vi-VN')}</span></p>
            )}
            {detail.order.ghi_chu && (
              <p className="text-sm italic text-slate-500 max-w-sm mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 w-full text-left md:text-right">" {detail.order.ghi_chu} "</p>
            )}
          </div>
        </div>

        {isUnpaidBanking && (
          <div className="my-8 p-5 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <h4 className="text-base font-black text-amber-950 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">account_balance</span> THÔNG TIN CHỜ CHUYỂN KHOẢN
              </h4>
              <Btn size="sm" onClick={() => onConfirmBankingPayment(orderId)}>Xác nhận đã nhận tiền</Btn>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-amber-950">
              <div>Ngân hàng: <span className="block font-bold text-base">{detail.order.banking_info?.bank_name || 'Techcombank'}</span></div>
              <div>Số tài khoản: <span className="block font-bold text-base tracking-wider">{detail.order.banking_info?.account_number || '4718072003'}</span></div>
              <div>Chủ tài khoản: <span className="block font-bold text-base uppercase">{detail.order.banking_info?.account_holder || 'Vo Ngoc Tan Tai'}</span></div>
              <div>Nội dung CK: <span className="inline-block bg-amber-200 px-2 py-1 font-mono font-bold text-base rounded mt-1">{'TT' + orderId}</span></div>
            </div>
            {detail.order.hinh_anh_chuyen_khoan && (
              <div className="pt-3 border-t border-amber-200">
                <p className="text-xs font-bold text-amber-800 mb-2">Minh chứng chuyển khoản từ khách hàng:</p>
                <img src={detail.order.hinh_anh_chuyen_khoan} alt="Banking proof" className="max-h-48 rounded-lg object-contain border border-amber-300 shadow-md" />
              </div>
            )}
          </div>
        )}

        {detail.order.loai_don === 'dat_truoc' && (
          <div className="my-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-blue-950 text-sm leading-relaxed">
            <span className="material-symbols-outlined text-blue-600 shrink-0 mt-0.5">info</span>
            <p>Đơn hàng đặt trước nông sản. Dự kiến chuẩn bị và xuất kho vào ngày <span className="font-bold text-base">{detail.order.ngay_giao_du_kien ? new Date(detail.order.ngay_giao_du_kien).toLocaleDateString('vi-VN') : 'chưa xác định'}</span>.</p>
          </div>
        )}


        <div className="py-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-1">Chi tiết mặt hàng</h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-sm text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-4 pl-2">Sản phẩm</th>
                  <th className="py-4 text-right w-36">Đơn giá</th>
                  <th className="py-4 text-center w-24">Số lượng</th>
                  <th className="py-4 text-right pr-2 w-40">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base font-medium">
                {(detail.order.items || []).map(item => (
                  <tr key={item.ma_chi_tiet} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-5 pl-2 flex items-center gap-4">
                      <img
                        src={item.hinh_san_pham ? (item.hinh_san_pham.startsWith('/upload/') ? `http://localhost:5000${item.hinh_san_pham}` : `http://localhost:5000/upload/${item.hinh_san_pham}`) : 'https://placehold.co/60x60/e2e8f0/475569?text=NS'}
                        alt={item.ten_san_pham}
                        className="h-14 w-14 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0 shadow-sm"
                      />
                      <span className="font-bold text-slate-900 text-lg line-clamp-2">{item.ten_san_pham}</span>
                    </td>
                    <td className="py-5 text-right text-slate-600 text-lg">{formatCurrency(item.don_gia)}</td>
                    <td className="py-5 text-center text-slate-800 text-lg font-bold">{item.so_luong}</td>
                    <td className="py-5 text-right pr-2 font-black text-slate-900 text-lg">{formatCurrency(item.thanh_tien)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


        <div className="flex flex-col items-center pt-6 border-t-2 border-dashed border-slate-300 text-base space-y-3">
          <div className="w-80 space-y-2.5">
            {Number(detail.order.giam_gia || 0) > 0 && (
              <>
                <div className="flex justify-between text-slate-500">
                  <span>Cộng tiền hàng:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(Number(detail.order.tong_thanh_toan || 0) + Number(detail.order.giam_gia || 0))}</span>
                </div>
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Chiết khấu giảm giá:</span>
                  <span className="font-bold">-{formatCurrency(detail.order.giam_gia)}</span>
                </div>
                {detail.order.ghi_chu_khuyen_mai && (
                  <p className="text-xs text-slate-400 bg-slate-50 p-2 rounded border border-slate-200 text-right italic">*{detail.order.ghi_chu_khuyen_mai}</p>
                )}
              </>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-200 text-slate-900 font-black items-baseline">
              <span className="text-lg uppercase tracking-wider">Tổng cộng:</span>
              <span className="text-3xl font-black text-primary tracking-tight">{formatCurrency(detail.order.tong_thanh_toan)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-6 mt-10 border-t border-slate-200">
          <Btn variant="outline" onClick={onClose} size="lg">Đóng hóa đơn</Btn>
          {canCancel && <Btn variant="danger" onClick={() => onCancel(orderId)} size="lg">Hủy đơn hàng</Btn>}
          {nextStatus && (
            <Btn size="lg" onClick={() => onAdvanceStatus(orderId, detail.order.trang_thai)}>
              {detail.order.trang_thai === 'cho_xac_nhan' && 'Xác nhận đơn'}
              {detail.order.trang_thai === 'da_xac_nhan' && 'Bắt đầu giao hàng'}
              {detail.order.trang_thai === 'dang_giao' && 'Xác nhận đã giao'}
            </Btn>
          )}
        </div>

      </div>
    </Modal>
  );
}


function SubscriptionDetailModal({ detail, subscriptionId, onClose, onDeliver, isDelivering }) {
  const subStatus = subscriptionStatusMap[detail.trang_thai] || subscriptionStatusMap.hoan_tat;
  const payMethod = paymentMethodLabel(detail.phuong_thuc_tt);

  return (
    <Modal title={`HÓA ĐƠN ĐĂNG KÝ ĐỊNH KỲ`} onClose={onClose} size="lg">
      <div className="bg-white px-6 py-4 text-slate-800 antialiased font-sans">
        
        {/* HEADER HÓA ĐƠN */}
        <div className="text-center space-y-2 pb-6 border-b-2 border-slate-900">
          <h2 className="text-3xl font-black tracking-wider text-slate-900 uppercase">MÃ ĐĂNG KÝ: #{subscriptionId}</h2>
          <p className="text-base text-slate-500 font-medium">
            Ngày bắt đầu: {detail.ngay_tao ? new Date(detail.ngay_tao).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
          </p>
          <div className="flex justify-center gap-3 pt-2 scale-110 origin-center">
            <Badge text={subStatus.label} color={subStatus.color} />
            <Badge text="Giao định kỳ" color="blue" />
            <Badge text={`Đã giao ${Number(detail.so_ky_da_giao || 0)}/${Number(detail.so_ky_giao || 0)} kỳ`} color="green" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-8 text-base border-b border-slate-200">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Người nhận hàng</h3>
            <p className="text-xl font-extrabold text-slate-900">{detail.ten_nguoi_nhan || detail.ten_nguoi_mua || 'Chưa cập nhật'}</p>
            <p className="text-slate-600 font-medium">SĐT: <a href={`tel:${detail.sdt_nguoi_nhan || detail.so_dien_thoai}`} className="text-primary hover:underline font-bold text-lg">{detail.sdt_nguoi_nhan || detail.so_dien_thoai || 'Chưa cập nhật'}</a></p>
            <p className="text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Địa chỉ:</span> {detail.dia_chi_giao || detail.dia_chi || 'Chưa cập nhật'}</p>
          </div>

          <div className="space-y-3 md:text-right md:flex md:flex-col md:items-end justify-start">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Phương thức & Chu kỳ</h3>
            <div className="mt-1 flex items-center gap-2 md:justify-end">
              <span className="text-slate-500 font-medium">Thanh toán:</span> 
              <Badge text={payMethod.label} color={payMethod.color} />
            </div>
            <p className="text-slate-600 font-medium">Tần suất giao: <span className="font-extrabold text-slate-900 text-lg">{frequencyMap[detail.tan_suat_giao] || detail.tan_suat_giao}</span></p>
            <p className="text-slate-600 font-medium">Kỳ tiếp theo: <span className="font-extrabold text-primary text-lg">{new Date(detail.ngay_giao_tiep_theo).toLocaleDateString('vi-VN')}</span></p>
            {detail.ghi_chu && (
              <p className="text-sm italic text-slate-500 max-w-sm mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 w-full text-left md:text-right">" {detail.ghi_chu} "</p>
            )}
          </div>
        </div>

        <div className="py-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-1">Sản phẩm đăng ký</h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-sm text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-4 pl-2">Sản phẩm</th>
                  <th className="py-4 text-right w-36">Đơn giá / kỳ</th>
                  <th className="py-4 text-center w-24">Số lượng</th>
                  <th className="py-4 text-right pr-2 w-40">Thành tiền / kỳ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base font-medium">
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-5 pl-2 flex items-center gap-4">
                    <img 
                      src={detail.hinh_san_pham ? (detail.hinh_san_pham.startsWith('/upload/') ? `http://localhost:5000${detail.hinh_san_pham}` : `http://localhost:5000/upload/${detail.hinh_san_pham}`) : 'https://placehold.co/60x60/e2e8f0/475569?text=NS'} 
                      alt={detail.ten_san_pham} 
                      className="h-14 w-14 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0 shadow-sm" 
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-lg line-clamp-2">{detail.ten_san_pham}</span>
                      <span className="text-xs text-slate-400 font-normal mt-0.5">Đơn vị tính: {detail.don_vi || 'Kg'}</span>
                    </div>
                  </td>
                  <td className="py-5 text-right text-slate-600 text-lg">{formatCurrency(detail.gia_tam_tinh)}</td>
                  <td className="py-5 text-center text-slate-800 text-lg font-bold">{detail.so_luong}</td>
                  <td className="py-5 text-right pr-2 font-black text-slate-900 text-lg">{formatCurrency(detail.gia_tam_tinh * detail.so_luong)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-center pt-6 border-t-2 border-dashed border-slate-300 text-base space-y-3">
          <div className="w-80 space-y-2.5">
            <div className="flex justify-between text-slate-500">
              <span>Tổng chu kỳ đăng ký:</span>
              <span className="font-bold text-slate-800">{detail.so_ky_giao || 5} kỳ</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-200 text-slate-900 font-black items-baseline">
              <span className="text-lg uppercase tracking-wider">Giá mỗi kỳ:</span>
              <span className="text-3xl font-black text-primary tracking-tight">{formatCurrency(detail.gia_tam_tinh * detail.so_luong)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-6 mt-10 border-t border-slate-200">
          <Btn variant="outline" onClick={onClose} size="lg">Đóng hóa đơn</Btn>
          {['dang_hoat_dong', 'tam_dung'].includes(detail.trang_thai) && (
            <Btn size="lg" onClick={() => onDeliver(detail.ma_dang_ky)} disabled={isDelivering}>
              {isDelivering ? 'Đang ghi nhận...' : 'Ghi nhận đã giao'}
            </Btn>
          )}
        </div>

      </div>
    </Modal>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState('thuong');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  
  const [selectedSub, setSelectedSub] = useState(null);
  const [deliveringSubscriptionId, setDeliveringSubscriptionId] = useState(null);
  const limit = 15;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (search) params.set('q', search);
      if (status) params.set('trang_thai', status);
      if (tab === 'subscription') {
        const data = await subscriptionAPI.adminAll();
        setSubscriptions(data.subscriptions || []);
        setOrders([]);
        setTotal(data.subscriptions?.length || 0);
      } else {
        params.set('loai_don', tab);
        const data = await api.get(`/admin/orders?${params.toString()}`);
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      }
    } catch { setOrders([]); setSubscriptions([]); setTotal(0); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, search, status, tab]);

  const openDetail = async id => {
    const response = await orderAPI.adminGetById(id);
    setSelectedId(id);
    setDetail(response);
  };

  const handleAdvanceStatus = async (id, currentStatus) => {
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;
    await orderAPI.adminUpdateStatus(id, { trang_thai: nextStatus });
    setOrders(prev => prev.map(order => order.ma_don_hang === id ? { ...order, trang_thai: nextStatus } : order));
    if (selectedId === id && detail) {
      setDetail(prev => ({ ...prev, order: { ...prev.order, trang_thai: nextStatus, ...(nextStatus === 'da_giao' ? { ngay_giao_thuc_te: new Date().toISOString() } : {}) } }));
    }
  };

  const handleCancel = async id => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;
    await orderAPI.adminUpdateStatus(id, { trang_thai: 'da_huy' });
    setOrders(prev => prev.map(order => order.ma_don_hang === id ? { ...order, trang_thai: 'da_huy' } : order));
  };

  const handleConfirmBankingPayment = async id => {
    if (!window.confirm('Xác nhận đã nhận được tiền chuyển khoản cho đơn hàng này?')) return;
    await api.patch('/orders/admin/' + id + '/confirm-banking');
    setOrders(prev => prev.map(order => order.ma_don_hang === id ? { ...order, trang_thai_thanh_toan: 'da_thanh_toan', trang_thai_tt: 'da_tt' } : order));
    if (selectedId === id && detail) {
      setDetail(prev => ({ ...prev, order: { ...prev.order, trang_thai_thanh_toan: 'da_thanh_toan', trang_thai_tt: 'da_tt' } }));
    }
  };

  const handleDeliverSubscription = async id => {
    if (!window.confirm('Ghi nhận đã giao một kỳ cho đăng ký này?')) return;
    setDeliveringSubscriptionId(id);
    try {
      const response = await subscriptionAPI.adminDeliver(id);
      
      setSubscriptions(prev => prev.map(sub => sub.ma_dang_ky === id ? { ...sub, so_ky_da_giao: response.subscription.so_ky_da_giao, ngay_giao_tiep_theo: response.subscription.ngay_giao_tiep_theo, trang_thai: response.subscription.trang_thai } : sub));
      
      if (selectedSub && selectedSub.ma_dang_ky === id) {
        setSelectedSub(prev => ({ ...prev, so_ky_da_giao: response.subscription.so_ky_da_giao, ngay_giao_tiep_theo: response.subscription.ngay_giao_tiep_theo, trang_thai: response.subscription.trang_thai }));
      }
    } finally { setDeliveringSubscriptionId(null); }
  };

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Đơn hàng" title="Theo dõi đơn hàng và các đăng ký giao định kỳ" body="Admin có thể xem toàn bộ đơn hàng, chuyển trạng thái xử lý và ghi nhận số kỳ đã giao cho từng đăng ký định kỳ." />

      <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
        <div className="flex gap-3 flex-wrap">
          {['thuong', 'dat_truoc', 'subscription'].map(t => (
            <button key={t} className={`rounded-xl px-5 py-2 text-body-md font-semibold transition-all ${tab === t ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
              onClick={() => { setTab(t); setPage(1); }}>
              <span className="material-symbols-outlined text-sm mr-1">{t === 'thuong' ? 'inventory' : t === 'dat_truoc' ? 'schedule' : 'repeat'}</span>
              {t === 'thuong' ? 'Đơn thường' : t === 'dat_truoc' ? 'Đặt trước' : 'Định kỳ'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm mã đơn hoặc địa chỉ..." />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusMap).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select>
          <div className="ml-auto text-body-md text-on-surface-variant">{tab === 'subscription' ? 'Tổng đăng ký: ' : 'Tổng đơn hàng: '}<span className="font-bold text-on-surface">{total}</span></div>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          {tab === 'subscription' ? (
            <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
              <h2 className="text-title-md font-title-md text-on-surface mb-lg">Đăng ký giao định kỳ</h2>
              {(subscriptions || []).length ? (
                <div className="space-y-3">
                  {subscriptions.map(subscription => {
                    const subStatus = subscriptionStatusMap[subscription.trang_thai] || subscriptionStatusMap.hoan_tat;
                    return (
                    
                      <div key={subscription.ma_dang_ky} onClick={() => setSelectedSub(subscription)} className="rounded-2xl border border-outline-variant bg-surface p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-title-md font-title-md text-on-surface">#{subscription.ma_dang_ky} - {subscription.ten_san_pham}</p>
                              <Badge text={subStatus.label} color={subStatus.color} />
                            </div>
                            <p className="mt-2 text-body-md text-on-surface-variant">{subscription.ten_nguoi_mua} · {subscription.so_luong} {subscription.don_vi} / kỳ · {frequencyMap[subscription.tan_suat_giao] || subscription.tan_suat_giao}</p>
                            <p className="mt-1 text-body-md font-bold text-primary">{formatCurrency(subscription.gia_tam_tinh * subscription.so_luong)} / kỳ{subscription.so_luong >= 10 && <span className="ml-2 text-label-sm font-normal text-on-surface-variant line-through">{formatCurrency(subscription.product?.price * subscription.so_luong)}</span>}</p>
                            <p className="mt-1 text-body-md font-bold text-primary">Đã giao {Number(subscription.so_ky_da_giao || 0)} / {Number(subscription.so_ky_giao || 0)} kỳ</p>
                            <p className="mt-1 text-body-md text-on-surface-variant">Kỳ tiếp theo: {new Date(subscription.ngay_giao_tiep_theo).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <div className="flex flex-col items-start gap-3 lg:items-end" onClick={e => e.stopPropagation()}>

                            {['dang_hoat_dong', 'tam_dung'].includes(subscription.trang_thai) && (
                              <Btn size="sm" onClick={() => handleDeliverSubscription(subscription.ma_dang_ky)} disabled={deliveringSubscriptionId === subscription.ma_dang_ky}>
                                {deliveringSubscriptionId === subscription.ma_dang_ky ? 'Đang ghi nhận...' : 'Ghi nhận đã giao'}
                              </Btn>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="py-8 text-center text-body-md text-on-surface-variant">Chưa có đăng ký giao định kỳ nào.</p>}
            </div>
          ) : (
            <Table headers={['Mã đơn', 'Loại đơn', 'Người mua', 'Điện thoại', 'Thanh toán', 'Tổng tiền', 'Trạng thái', 'Ngày tạo', 'Thao tác']}
              empty={{ icon: 'receipt_long', text: 'Không có đơn hàng phù hợp.' }}>
              {orders.map(order => {
                const orderStatus = statusMap[order.trang_thai] || { label: order.trang_thai, color: 'gray' };
                const orderType = orderTypeMap[order.loai_don || 'thuong'] || orderTypeMap.thuong;
                return (
                  <tr key={order.ma_don_hang} className="hover:bg-surface-container-low">
                    <td className="px-4 py-3 text-body-md font-bold text-on-surface">#{order.ma_don_hang}</td>
                    <td className="px-4 py-3"><Badge text={orderType.label} color={orderType.color} /></td>
                    <td className="px-4 py-3 text-body-md text-on-surface">{order.ten_nguoi_nhan || order.ho_ten || 'Khách hàng'}</td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{order.sdt_nguoi_nhan || 'Chưa cập nhật'}</td>
                    <td className="px-4 py-3">{(() => { const pm = paymentMethodLabel(order.phuong_thuc_tt); return <Badge text={pm.label} color={pm.color} />; })()}</td>
                    <td className="px-4 py-3 text-body-md font-bold text-primary">{formatCurrency(order.tong_thanh_toan)}</td>
                    <td className="px-4 py-3"><Badge text={orderStatus.label} color={orderStatus.color} /></td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{new Date(order.ngay_tao).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3"><Btn size="sm" variant="outline" onClick={() => openDetail(order.ma_don_hang)}>Xem</Btn></td>
                  </tr>
                );
              })}
            </Table>
          )}
        </>
      )}
      <Pagination page={page} total={total} limit={limit} onChange={setPage} />
      
      {selectedId && detail && <OrderDetailModal detail={detail} orderId={selectedId} onClose={() => { setSelectedId(null); setDetail(null); }} onAdvanceStatus={handleAdvanceStatus} onCancel={handleCancel} onConfirmBankingPayment={handleConfirmBankingPayment} />}
      
      {selectedSub && <SubscriptionDetailModal detail={selectedSub} subscriptionId={selectedSub.ma_dang_ky} onClose={() => setSelectedSub(null)} onDeliver={handleDeliverSubscription} isDelivering={deliveringSubscriptionId === selectedSub.ma_dang_ky} />}
    </div>
  );
}