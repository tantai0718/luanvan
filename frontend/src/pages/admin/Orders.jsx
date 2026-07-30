import { useEffect, useState } from 'react';
import { api, orderAPI, subscriptionAPI } from '../../services/api';
import { Download, Calendar, Repeat, Banknote, Info, ChevronRight } from 'lucide-react';
import { Badge, Btn, Loading, Modal, PageHero, Pagination, SearchBar, Table } from '../../components/ui/AdminUI';
import { pickProductImage } from '../../utils/marketImages';
import * as XLSX from 'xlsx';

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
const tinhTongTienMoiKy = (subscription) => {
  const tienSanPham = Number(subscription.gia_tam_tinh || 0) * Number(subscription.so_luong || 0);
  const coDonCoc = !!subscription.order_id && Number(subscription.order_tong_tien) > 0;
  const phiVanChuyen = coDonCoc
    ? Math.max(0, Number(subscription.order_tong_tien) - tienSanPham)
    : (tienSanPham >= 500000 ? 0 : 30000);
  return coDonCoc ? Number(subscription.order_tong_tien) : tienSanPham + phiVanChuyen;
};

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

  const daThanhToan = Number(detail.order.tong_da_thanh_toan || 0);
  const tongTien = Number(detail.order.tong_thanh_toan || 0);
  const conLai = Math.max(0, tongTien - daThanhToan);

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

        {/* ĐÃ THANH TOÁN / CÒN LẠI */}
        <div className="my-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tổng đơn</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(tongTien)}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-green-600">Đã thanh toán</p>
            <p className="mt-1 text-xl font-black text-green-700">{formatCurrency(daThanhToan)}</p>
            {detail.order.tien_coc > 0 && (
              <p className="mt-0.5 text-[11px] text-green-600">(Đặt cọc: {formatCurrency(detail.order.tien_coc)})</p>
            )}
          </div>
          <div className={`rounded-xl border p-4 text-center ${conLai > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${conLai > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Còn lại</p>
            <p className={`mt-1 text-xl font-black ${conLai > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{formatCurrency(conLai)}</p>
          </div>
        </div>

        {isUnpaidBanking && (
          <div className="my-8 p-5 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <h4 className="text-base font-black text-amber-950 flex items-center gap-2">
                <Banknote size={18} /> THÔNG TIN CHỜ CHUYỂN KHOẢN
              </h4>
              <Btn size="sm" onClick={() => onConfirmBankingPayment(orderId)}>Xác nhận đã nhận tiền</Btn>
            </div>
            {(detail.order.tien_coc || 0) > 0 && (
              <div className="text-sm text-amber-900 space-y-1 bg-amber-100/50 rounded-lg p-3">
                <p>Tổng đơn: <strong>{formatCurrency(detail.order.tong_thanh_toan)}</strong></p>
                <p className="font-bold text-amber-950">Cần nhận qua QR: {formatCurrency(detail.order.tien_coc)}</p>
                <p>Còn lại (COD): {formatCurrency(detail.order.tong_thanh_toan - detail.order.tien_coc)}</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-amber-950">
              <div>Ngân hàng: <span className="block font-bold text-base">{detail.order.banking_info?.bank_name || 'MB Bank'}</span></div>
              <div>Số tài khoản: <span className="block font-bold text-base tracking-wider">{detail.order.banking_info?.account_number || '2210118072003'}</span></div>
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
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
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
              <span className="text-3xl font-black text-primary tracking-tight">{formatCurrency(tinhTongTienMoiKy(detail))}</span>
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

// ══════════════════════════════════════════════════════════════════
// MODAL — CHI TIẾT DÒNG TỔNG HỢP ĐẶT TRƯỚC
// ══════════════════════════════════════════════════════════════════
function PreorderSummaryDetailModal({ group, orders, loading, onClose }) {
  return (
    <Modal title={`CHI TIẾT: ${group.ten_san_pham} — ${new Date(group.ngay_giao + 'T00:00:00').toLocaleDateString('vi-VN')}`} onClose={onClose} size="lg">
      <div className="bg-white px-6 py-4 text-slate-800">
        <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <img
            src={group.hinh_san_pham ? (group.hinh_san_pham.startsWith('/upload/') ? `http://localhost:5000${group.hinh_san_pham}` : `http://localhost:5000/upload/${group.hinh_san_pham}`) : 'https://placehold.co/60x60/e2e8f0/475569?text=NS'}
            alt={group.ten_san_pham}
            className="h-14 w-14 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div>
            <p className="text-lg font-black text-slate-900">{group.ten_san_pham}</p>
            <p className="text-sm text-slate-500">
              Tổng cần chuẩn bị: <span className="font-bold text-primary">{group.tong_so_luong} {group.don_vi}</span> — từ {group.so_don} đơn hàng
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-400">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300 text-xs text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-3 pr-4">Mã đơn</th>
                  <th className="py-3 pr-4">Khách hàng</th>
                  <th className="py-3 pr-4">Địa chỉ</th>
                  <th className="py-3 pr-4 text-center">Số lượng</th>
                  <th className="py-3 pr-4 text-right">Đã trả</th>
                  <th className="py-3 pr-4 text-right">Còn lại</th>
                  <th className="py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(o => {
                  const conLai = Math.max(0, o.tong_thanh_toan - o.tong_da_thanh_toan);
                  const st = statusMap[o.trang_thai] || { label: o.trang_thai, color: 'gray' };
                  return (
                    <tr key={o.ma_don_hang} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-bold text-slate-900">#{o.ma_don_hang}</td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-800">{o.ten_nguoi_nhan}</p>
                        <p className="text-xs text-slate-400">{o.sdt_nguoi_nhan}</p>
                      </td>
                      <td className="py-3 pr-4 max-w-[200px] truncate text-slate-600">{o.dia_chi_giao}</td>
                      <td className="py-3 pr-4 text-center font-bold text-slate-800">{o.so_luong}</td>
                      <td className="py-3 pr-4 text-right text-green-700 font-semibold">{formatCurrency(o.tong_da_thanh_toan)}</td>
                      <td className={`py-3 pr-4 text-right font-semibold ${conLai > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{formatCurrency(conLai)}</td>
                      <td className="py-3"><Badge text={st.label} color={st.color} /></td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">Không có đơn hàng nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-6 mt-6 border-t border-slate-200">
          <Btn variant="outline" onClick={onClose}>Đóng</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODAL — CHI TIẾT DÒNG TỔNG HỢP ĐỊNH KỲ
// ══════════════════════════════════════════════════════════════════
function SubscriptionSummaryDetailModal({ group, items, loading, onClose }) {
  return (
    <Modal title={`CHI TIẾT: ${group.ten_san_pham} — Kỳ ${new Date(group.ngay_giao + 'T00:00:00').toLocaleDateString('vi-VN')}`} onClose={onClose} size="lg">
      <div className="bg-white px-6 py-4 text-slate-800">
        <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <img
            src={group.hinh_san_pham ? (group.hinh_san_pham.startsWith('/upload/') ? `http://localhost:5000${group.hinh_san_pham}` : `http://localhost:5000/upload/${group.hinh_san_pham}`) : 'https://placehold.co/60x60/e2e8f0/475569?text=NS'}
            alt={group.ten_san_pham}
            className="h-14 w-14 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div>
            <p className="text-lg font-black text-slate-900">{group.ten_san_pham}</p>
            <p className="text-sm text-slate-500">
              Tổng cần chuẩn bị: <span className="font-bold text-primary">{group.tong_so_luong} {group.don_vi}</span> — từ {group.so_don} đăng ký
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-400">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300 text-xs text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-3 pr-4">Mã đăng ký</th>
                  <th className="py-3 pr-4">Khách hàng</th>
                  <th className="py-3 pr-4">Địa chỉ</th>
                  <th className="py-3 pr-4 text-center">Số lượng</th>
                  <th className="py-3 pr-4">Chu kỳ</th>
                  <th className="py-3 pr-4 text-center">Tiến độ</th>
                  <th className="py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(it => {
                  const st = subscriptionStatusMap[it.trang_thai] || { label: it.trang_thai, color: 'gray' };
                  return (
                    <tr key={it.ma_dang_ky} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-bold text-slate-900">#{it.ma_dang_ky}</td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-800">{it.ten_nguoi_mua}</p>
                        <p className="text-xs text-slate-400">{it.so_dien_thoai}</p>
                      </td>
                      <td className="py-3 pr-4 max-w-[200px] truncate text-slate-600">{it.dia_chi_giao}</td>
                      <td className="py-3 pr-4 text-center font-bold text-slate-800">{it.so_luong}</td>
                      <td className="py-3 pr-4 text-slate-600">{frequencyMap[it.tan_suat_giao] || it.tan_suat_giao}</td>
                      <td className="py-3 pr-4 text-center text-slate-600">{it.so_ky_da_giao}/{it.so_ky_giao}</td>
                      <td className="py-3"><Badge text={st.label} color={st.color} /></td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">Không có đăng ký nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-6 mt-6 border-t border-slate-200">
          <Btn variant="outline" onClick={onClose}>Đóng</Btn>
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

  // --- Tổng hợp đơn đặt trước theo ngày ---
  const [preorderView, setPreorderView] = useState('list');
  const [summary, setSummary] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupOrders, setGroupOrders] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);

  // --- Tổng hợp đăng ký định kỳ theo ngày ---
  const [subSummary, setSubSummary] = useState([]);
  const [subSummaryLoading, setSubSummaryLoading] = useState(false);
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [subGroupItems, setSubGroupItems] = useState([]);
  const [subGroupLoading, setSubGroupLoading] = useState(false);

  const isSummaryMode = (tab === 'dat_truoc' || tab === 'subscription') && preorderView === 'summary';

const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (search) params.set('q', search);
      if (status) params.set('trang_thai', status);

      if (tab === 'subscription') {
        const data = await subscriptionAPI.adminAll();
        let list = data.subscriptions || [];

        if (search) {
          const kw = search.trim().toLowerCase();
          list = list.filter(s =>
            String(s.ma_dang_ky).includes(kw) ||
            (s.dia_chi_giao || '').toLowerCase().includes(kw) ||
            (s.ten_nguoi_mua || '').toLowerCase().includes(kw)
          );
        }
        if (status) {
          list = list.filter(s => s.trang_thai === status);
        }

        setSubscriptions(list);
        setOrders([]);
        setTotal(list.length);
      } else {
        params.set('loai_don', tab);
        const data = await api.get(`/orders/admin/list?${params.toString()}`);
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      }
    } catch { setOrders([]); setSubscriptions([]); setTotal(0); }
    finally { setLoading(false); }
};

const exportExcel = async () => {
    try {
        const [thuongData, datTruocData, subData] = await Promise.all([
        api.get(`/orders/admin/list?limit=9999&loai_don=thuong`),
        api.get(`/orders/admin/list?limit=9999&loai_don=dat_truoc`),
        subscriptionAPI.adminAll(),
]);
      

      const mapOrderRow = (o, i) => ({
        'STT': i + 1,
        'Mã đơn': o.ma_don_hang,
        'Người mua': o.ten_nguoi_nhan || o.ho_ten || '',
        'Điện thoại': o.sdt_nguoi_nhan || '',
        'Địa chỉ giao': o.dia_chi_giao || '',
        'Phương thức TT': paymentMethodLabel(o.phuong_thuc_tt).label,
        'Tổng tiền': Number(o.tong_thanh_toan || 0),
        'Giảm giá': Number(o.giam_gia || 0),
        'Trạng thái': (statusMap[o.trang_thai] || {}).label || o.trang_thai,
        'Trạng thái TT': o.trang_thai_tt === 'da_tt' ? 'Đã thanh toán' : 'Chưa thanh toán',
        'Ngày tạo': o.ngay_tao ? new Date(o.ngay_tao).toLocaleDateString('vi-VN') : '',
      });

      const thuongRows = (thuongData.orders || []).map(mapOrderRow);
      const datTruocRows = (datTruocData.orders || []).map(mapOrderRow);
      const subRows = (subData.subscriptions || []).map((s, i) => ({
        'STT': i + 1,
        'Mã đăng ký': s.ma_dang_ky,
        'Sản phẩm': s.ten_san_pham,
        'Khách hàng': s.ten_nguoi_mua,
        'Số lượng/kỳ': s.so_luong,
        'Tần suất': frequencyMap[s.tan_suat_giao] || s.tan_suat_giao,
        'Giá/kỳ': tinhTongTienMoiKy(s),
        'Đã giao': `${s.so_ky_da_giao || 0}/${s.so_ky_giao || 0}`,
        'Trạng thái': (subscriptionStatusMap[s.trang_thai] || {}).label || s.trang_thai,
        'Kỳ tiếp theo': s.ngay_giao_tiep_theo ? new Date(s.ngay_giao_tiep_theo).toLocaleDateString('vi-VN') : '',
      }));

      const wb = XLSX.utils.book_new();

      const addSheetWithTotal = (rows, sheetName, totalKey) => {
        const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'Thông báo': 'Không có dữ liệu' }]);
        if (rows.length && totalKey) {
          const total = rows.reduce((sum, r) => sum + Number(r[totalKey] || 0), 0);
          const colIndex = Object.keys(rows[0]).indexOf(totalKey);
          const emptyRow = Array(colIndex).fill('');
          XLSX.utils.sheet_add_aoa(ws, [[...emptyRow, 'Tổng cộng:', total]], { origin: -1 });
        }
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      };

      addSheetWithTotal(thuongRows, 'Don thuong', 'Tổng tiền');
      addSheetWithTotal(datTruocRows, 'Dat truoc', 'Tổng tiền');
      addSheetWithTotal(subRows, 'Dinh ky', null);

      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const fileName = `don_hang_${dd}-${mm}-${yyyy}.xlsx`;

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
    } catch (err) {
      alert('Không xuất được dữ liệu: ' + (err.message || 'Lỗi không xác định'));
    }
};

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const data = await orderAPI.adminPreorderSummary();
      setSummary(data.summary || []);
    } catch {
      setSummary([]);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchSubSummary = async () => {
    setSubSummaryLoading(true);
    try {
      const data = await subscriptionAPI.adminSummary();
      setSubSummary(data.summary || []);
    } catch {
      setSubSummary([]);
    } finally {
      setSubSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'dat_truoc' && preorderView === 'summary') {
      fetchSummary();
    } else if (tab === 'subscription' && preorderView === 'summary') {
      fetchSubSummary();
    } else {
      fetchOrders();
    }
    // eslint-disable-next-line
  }, [page, search, status, tab, preorderView]);

  const openDetail = async id => {
    const response = await orderAPI.adminGetById(id);
    setSelectedId(id);
    setDetail(response);
  };

  const openGroupDetail = async group => {
    setSelectedGroup(group);
    setGroupLoading(true);
    try {
      const data = await orderAPI.adminPreorderSummaryDetail(group.ngay_giao, group.masp);
      setGroupOrders(data.orders || []);
    } catch {
      setGroupOrders([]);
    } finally {
      setGroupLoading(false);
    }
  };

  const openSubGroupDetail = async group => {
    setSelectedSubGroup(group);
    setSubGroupLoading(true);
    try {
      const data = await subscriptionAPI.adminSummaryDetail(group.ngay_giao, group.masp);
      setSubGroupItems(data.items || []);
    } catch {
      setSubGroupItems([]);
    } finally {
      setSubGroupLoading(false);
    }
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
      <PageHero
  eyebrow="Đơn hàng"
  title="Theo dõi đơn hàng và các đăng ký giao định kỳ"
  body="Admin có thể xem toàn bộ đơn hàng, chuyển trạng thái xử lý và ghi nhận số kỳ đã giao cho từng đăng ký định kỳ."
  actions={
    <Btn variant="outline" onClick={exportExcel}>
      <Download size={16} className="mr-1" /> Xuất Excel
    </Btn>
  }
/>

      <div className="bg-card rounded-card p-5 border border-border shadow-card">
        <div className="flex gap-3 flex-wrap">
          {['thuong', 'dat_truoc', 'subscription'].map(t => (
            <button key={t} className={`rounded-btn px-5 py-2 text-body font-semibold transition-all ${tab === t ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-border/30'}`}
              onClick={() => { setTab(t); setPage(1); setPreorderView('list'); }}>
              {t === 'thuong' ? <><Calendar size={16} className="mr-1 inline" /> Đơn thường</> : t === 'dat_truoc' ? <><Calendar size={16} className="mr-1 inline" /> Đặt trước</> : <><Repeat size={16} className="mr-1 inline" /> Định kỳ</>}
            </button>
          ))}
        </div>

        {(tab === 'dat_truoc' || tab === 'subscription') && (
          <div className="mt-4 flex gap-2 border-t border-border pt-4">
            <button
              className={`rounded-btn px-4 py-1.5 text-sm font-semibold transition-all ${preorderView === 'list' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              onClick={() => setPreorderView('list')}
            >
               Danh sách đơn
            </button>
            <button
              className={`rounded-btn px-4 py-1.5 text-sm font-semibold transition-all ${preorderView === 'summary' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              onClick={() => setPreorderView('summary')}
            >
               Tổng hợp theo ngày
            </button>
          </div>
        )}
      </div>

      {!isSummaryMode && (
        <div className="bg-card rounded-card p-5 border border-border shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm mã đơn hoặc địa chỉ..." />
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="rounded-btn border border-border bg-card px-4 py-3 text-body focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light">
              <option value="">Tất cả trạng thái</option>
                  {tab === 'subscription'
                  ? Object.entries(subscriptionStatusMap).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)
                  : Object.entries(statusMap).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)
              }
                </select>
            <div className="ml-auto text-body text-text-secondary">{tab === 'subscription' ? 'Tổng đăng ký: ' : 'Tổng đơn hàng: '}<span className="font-bold text-text-primary">{total}</span></div>
          </div>
        </div>
      )}

      {tab === 'dat_truoc' && preorderView === 'summary' ? (
        summaryLoading ? <Loading /> : (
          <div className="bg-card rounded-card p-5 border border-border shadow-card">
            <h2 className="text-h3 text-text-primary mb-5">Tổng hợp sản phẩm cần chuẩn bị theo ngày giao</h2>
            {summary.length ? (
              (() => {
                const byDate = summary.reduce((acc, row) => {
                  const key = row.ngay_giao;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(row);
                  return acc;
                }, {});
                return Object.entries(byDate).map(([ngay, rows]) => (
                  <div key={ngay} className="mb-6 last:mb-0">
                    <div className="mb-3 flex items-center gap-2">
                      <Calendar size={18} className="text-primary" />
                      <h3 className="text-lg font-bold text-text-primary">Ngày giao: {new Date(ngay + 'T00:00:00').toLocaleDateString('vi-VN')}</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {rows.map(row => (
                        <button
                          key={`${row.ngay_giao}-${row.masp}`}
                          onClick={() => openGroupDetail(row)}
                          className="flex items-center gap-3 rounded-btn border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md"
                        >
                          <img
                            src={row.hinh_san_pham ? (row.hinh_san_pham.startsWith('/upload/') ? `http://localhost:5000${row.hinh_san_pham}` : `http://localhost:5000/upload/${row.hinh_san_pham}`) : 'https://placehold.co/60x60/e2e8f0/475569?text=NS'}
                            alt={row.ten_san_pham}
                            className="h-12 w-12 shrink-0 rounded-xl object-cover border border-slate-200"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-slate-900">{row.ten_san_pham}</p>
                            <p className="text-lg font-black text-primary">{row.tong_so_luong} {row.don_vi}</p>
                            <p className="text-xs text-slate-400">{row.so_don} đơn hàng</p>
                          </div>
                          <ChevronRight size={20} className="text-slate-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()
            ) : (
              <p className="py-8 text-center text-body text-text-secondary">Chưa có đơn đặt trước nào.</p>
            )}
          </div>
        )
      ) : tab === 'subscription' && preorderView === 'summary' ? (
        subSummaryLoading ? <Loading /> : (
          <div className="bg-card rounded-card p-5 border border-border shadow-card">
            <h2 className="text-h3 text-text-primary mb-5">Tổng hợp sản phẩm cần chuẩn bị theo kỳ giao</h2>
            {subSummary.length ? (
              (() => {
                const byDate = subSummary.reduce((acc, row) => {
                  const key = row.ngay_giao;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(row);
                  return acc;
                }, {});
                return Object.entries(byDate).map(([ngay, rows]) => (
                  <div key={ngay} className="mb-6 last:mb-0">
                    <div className="mb-3 flex items-center gap-2">
                      <Calendar size={18} className="text-primary" />
                      <h3 className="text-lg font-bold text-text-primary">Kỳ giao: {new Date(ngay + 'T00:00:00').toLocaleDateString('vi-VN')}</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {rows.map(row => (
                        <button
                          key={`${row.ngay_giao}-${row.masp}`}
                          onClick={() => openSubGroupDetail(row)}
                          className="flex items-center gap-3 rounded-btn border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md"
                        >
                          <img
                            src={row.hinh_san_pham ? (row.hinh_san_pham.startsWith('/upload/') ? `http://localhost:5000${row.hinh_san_pham}` : `http://localhost:5000/upload/${row.hinh_san_pham}`) : 'https://placehold.co/60x60/e2e8f0/475569?text=NS'}
                            alt={row.ten_san_pham}
                            className="h-12 w-12 shrink-0 rounded-xl object-cover border border-slate-200"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-slate-900">{row.ten_san_pham}</p>
                            <p className="text-lg font-black text-primary">{row.tong_so_luong} {row.don_vi}</p>
                            <p className="text-xs text-slate-400">{row.so_don} đăng ký</p>
                          </div>
                          <ChevronRight size={20} className="text-slate-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()
            ) : (
              <p className="py-8 text-center text-body text-text-secondary">Chưa có đăng ký định kỳ nào sắp tới kỳ giao.</p>
            )}
          </div>
        )
      ) : loading ? <Loading /> : (
        <>
          {tab === 'subscription' ? (
            <div className="bg-card rounded-card p-5 border border-border shadow-card">
              <h2 className="text-h3 text-text-primary mb-5">Đăng ký giao định kỳ</h2>
              {(subscriptions || []).length ? (
                <div className="space-y-3">
                  {subscriptions.map(subscription => {
                    const subStatus = subscriptionStatusMap[subscription.trang_thai] || subscriptionStatusMap.hoan_tat;
                    return (

                      <div key={subscription.ma_dang_ky} onClick={() => setSelectedSub(subscription)} className="rounded-btn border border-border bg-card p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-body font-semibold text-text-primary">#{subscription.ma_dang_ky} - {subscription.ten_san_pham}</p>
                              <Badge text={subStatus.label} color={subStatus.color} />
                            </div>
                            <p className="mt-2 text-body text-text-secondary">{subscription.ten_nguoi_mua} · {subscription.so_luong} {subscription.don_vi} / kỳ · {frequencyMap[subscription.tan_suat_giao] || subscription.tan_suat_giao}</p>
                            <p className="mt-1 text-body font-bold text-primary">{formatCurrency(tinhTongTienMoiKy(subscription))} / kỳ{subscription.so_luong >= 10 && <span className="ml-2 text-caption font-normal text-text-secondary line-through">{formatCurrency(subscription.product?.price * subscription.so_luong)}</span>}</p>
                            <p className="mt-1 text-body font-bold text-primary">Đã giao {Number(subscription.so_ky_da_giao || 0)} / {Number(subscription.so_ky_giao || 0)} kỳ</p>
                            <p className="mt-1 text-body text-text-secondary">Kỳ tiếp theo: {new Date(subscription.ngay_giao_tiep_theo).toLocaleDateString('vi-VN')}</p>
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
              ) : <p className="py-8 text-center text-body text-text-secondary">Chưa có đăng ký giao định kỳ nào.</p>}
            </div>
          ) : (
            <Table headers={['Mã đơn', 'Loại đơn', 'Người mua', 'Điện thoại', 'Thanh toán', 'Tổng tiền', 'Trạng thái', 'Ngày tạo', 'Thao tác']}
              empty={{ text: 'Không có đơn hàng phù hợp.' }}>
              {orders.map(order => {
                const orderStatus = statusMap[order.trang_thai] || { label: order.trang_thai, color: 'gray' };
                const orderType = orderTypeMap[order.loai_don || 'thuong'] || orderTypeMap.thuong;
                return (
                  <tr key={order.ma_don_hang} className="hover:bg-background">
                    <td className="px-4 py-3 text-body font-bold text-text-primary">#{order.ma_don_hang}</td>
                    <td className="px-4 py-3"><Badge text={orderType.label} color={orderType.color} /></td>
                    <td className="px-4 py-3 text-body text-text-primary">{order.ten_nguoi_nhan || order.ho_ten || 'Khách hàng'}</td>
                    <td className="px-4 py-3 text-body text-text-secondary">{order.sdt_nguoi_nhan || 'Chưa cập nhật'}</td>
                    <td className="px-4 py-3">{(() => { const pm = paymentMethodLabel(order.phuong_thuc_tt); return <Badge text={pm.label} color={pm.color} />; })()}</td>
                    <td className="px-4 py-3 text-body font-bold text-primary">{formatCurrency(order.tong_thanh_toan)}</td>
                    <td className="px-4 py-3"><Badge text={orderStatus.label} color={orderStatus.color} /></td>
                    <td className="px-4 py-3 text-body text-text-secondary">{new Date(order.ngay_tao).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3"><Btn size="sm" variant="outline" onClick={() => openDetail(order.ma_don_hang)}>Xem</Btn></td>
                  </tr>
                );
              })}
            </Table>
          )}
        </>
      )}
      {!isSummaryMode && (
        <Pagination page={page} total={total} limit={limit} onChange={setPage} />
      )}

      {selectedId && detail && <OrderDetailModal detail={detail} orderId={selectedId} onClose={() => { setSelectedId(null); setDetail(null); }} onAdvanceStatus={handleAdvanceStatus} onCancel={handleCancel} onConfirmBankingPayment={handleConfirmBankingPayment} />}

      {selectedSub && <SubscriptionDetailModal detail={selectedSub} subscriptionId={selectedSub.ma_dang_ky} onClose={() => setSelectedSub(null)} onDeliver={handleDeliverSubscription} isDelivering={deliveringSubscriptionId === selectedSub.ma_dang_ky} />}

      {selectedGroup && (
        <PreorderSummaryDetailModal
          group={selectedGroup}
          orders={groupOrders}
          loading={groupLoading}
          onClose={() => { setSelectedGroup(null); setGroupOrders([]); }}
        />
      )}

      {selectedSubGroup && (
        <SubscriptionSummaryDetailModal
          group={selectedSubGroup}
          items={subGroupItems}
          loading={subGroupLoading}
          onClose={() => { setSelectedSubGroup(null); setSubGroupItems([]); }}
        />
      )}
    </div>
  );
}
