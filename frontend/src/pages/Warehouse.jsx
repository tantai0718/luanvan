import { useEffect, useMemo, useState } from 'react';
import { productAPI, warehouseAPI } from '../services/api';

const cn = (...values) => values.filter(Boolean).join(' ');
const money = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const dateTime = value => (value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có');
const shortDate = value => (value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có');

const invoiceStatusTone = status =>
  status === 'da_xac_nhan' ? 'green' : status === 'da_huy' ? 'red' : 'yellow';

const invoiceStatusText = status =>
  status === 'da_xac_nhan' ? 'Đã xác nhận' : status === 'da_huy' ? 'Đã hủy' : 'Chờ xác nhận';

const expiryMeta = value => {
  if (!value) return { text: 'Chưa có hạn dùng', tone: 'gray' };

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const expiry = new Date(value);
  const diffDays = Math.ceil((expiry - start) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `Hết hạn ${Math.abs(diffDays)} ngày`, tone: 'red' };
  if (diffDays === 0) return { text: 'Hết hạn hôm nay', tone: 'red' };
  if (diffDays <= 7) return { text: `Còn ${diffDays} ngày`, tone: 'orange' };
  return { text: shortDate(value), tone: 'green' };
};

function Badge({ text, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', tones[tone])}>{text}</span>;
}

function FilterInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">🔍</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-orange-500 focus:outline-none"
      />
    </div>
  );
}

function MetricCard({ title, value, helper, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    orange: 'bg-orange-50 border-orange-100',
    red: 'bg-red-50 border-red-100',
  };

  return (
    <div className={cn('rounded-2xl border p-5', tones[tone])}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="py-14 text-center text-sm text-gray-400">
      <div className="mb-3 text-4xl">📦</div>
      <p>{text}</p>
    </div>
  );
}

function LocationSelect({ value, onChange, locations, placeholder = 'Chọn vị trí kho' }) {
  return (
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
    >
      <option value="">{placeholder}</option>
      {locations.map(location => (
        <option key={location.ma_vi_tri} value={location.ten_vi_tri}>
          {location.ten_vi_tri}
        </option>
      ))}
    </select>
  );
}

function InvoiceModal({ warehouses, onClose, onDone }) {
  const emptyItem = { ma_san_pham: '', ten_san_pham: '', so_luong: 1, don_vi: 'kg', don_gia: 0, han_su_dung: '', vi_tri_kho: '' };
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    loai_hoa_don: 'nhap_kho',
    ma_kho: '',
    ghi_chu: '',
    items: [emptyItem],
  });

  useEffect(() => {
    productAPI.getAll('?limit=200')
      .then(data => setProducts(data.products || []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (!form.ma_kho) {
      setLocations([]);
      return;
    }

    warehouseAPI.getLocations(form.ma_kho)
      .then(data => setLocations(data.locations || []))
      .catch(() => setLocations([]));
  }, [form.ma_kho]);

  const updateItem = (index, key, value) => {
    setForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [key]: value };

      if (key === 'ma_san_pham') {
        const found = products.find(product => String(product.ma_san_pham) === String(value));
        if (found) {
          items[index] = {
            ...items[index],
            ma_san_pham: value,
            ten_san_pham: found.ten_san_pham,
            don_vi: found.don_vi,
            don_gia: found.gia_ban,
          };
        }
      }

      return { ...prev, items };
    });
  };

  const total = useMemo(
    () => form.items.reduce((sum, item) => sum + Number(item.so_luong || 0) * Number(item.don_gia || 0), 0),
    [form.items]
  );

  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await warehouseAPI.createInvoice({
        ...form,
        ma_kho: Number(form.ma_kho),
        items: form.items.map(item => ({
          ...item,
          ma_san_pham: Number(item.ma_san_pham),
          so_luong: Number(item.so_luong),
          don_gia: Number(item.don_gia),
        })),
      });
      onDone();
    } catch (err) {
      setError(err.message || 'Không tạo được hóa đơn kho.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Tạo hóa đơn kho</h2>
            <p className="mt-1 text-xs text-gray-400">Lập phiếu nhập hoặc xuất kho với vị trí lưu có sẵn theo từng kho.</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-600">×</button>
        </div>

        <form onSubmit={submit} className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['nhap_kho', 'Nhập kho'],
                ['xuat_kho', 'Xuất kho'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, loai_hoa_don: value }))}
                  className={cn(
                    'rounded-2xl border-2 p-4 text-left text-sm font-semibold transition-all',
                    form.loai_hoa_don === value ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-600'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <select
                required
                value={form.ma_kho}
                onChange={event => setForm(prev => ({
                  ...prev,
                  ma_kho: event.target.value,
                  items: prev.items.map(item => ({ ...item, vi_tri_kho: '' })),
                }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
              >
                <option value="">Chọn kho</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.ma_kho} value={warehouse.ma_kho}>{warehouse.ten_kho}</option>
                ))}
              </select>

              <input
                value={form.ghi_chu}
                onChange={event => setForm(prev => ({ ...prev, ghi_chu: event.target.value }))}
                placeholder="Ghi chú vận hành"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Chi tiết mặt hàng</h3>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, items: [...prev.items, { ...emptyItem }] }))}
                className="text-sm font-medium text-orange-600"
              >
                + Thêm dòng
              </button>
            </div>

            {form.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 rounded-2xl bg-gray-50 p-3">
                <div className="col-span-12 md:col-span-3">
                  <select
                    required
                    value={item.ma_san_pham}
                    onChange={event => updateItem(index, 'ma_san_pham', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Chọn sản phẩm</option>
                    {products.map(product => (
                      <option key={product.ma_san_pham} value={product.ma_san_pham}>{product.ten_san_pham}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4 md:col-span-1">
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.so_luong}
                    onChange={event => updateItem(index, 'so_luong', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-4 md:col-span-1">
                  <input
                    value={item.don_vi}
                    onChange={event => updateItem(index, 'don_vi', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={item.don_gia}
                    onChange={event => updateItem(index, 'don_gia', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <input
                    type="date"
                    value={item.han_su_dung}
                    onChange={event => updateItem(index, 'han_su_dung', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <LocationSelect
                    value={item.vi_tri_kho}
                    onChange={value => updateItem(index, 'vi_tri_kho', value)}
                    locations={locations}
                    placeholder={form.ma_kho ? 'Chọn vị trí' : 'Chọn kho trước'}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, items: prev.items.filter((_, itemIndex) => itemIndex !== index) }))}
                    className="w-full rounded-xl bg-red-50 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-orange-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Tổng giá trị tạm tính</p>
            <p className="mt-2 text-2xl font-bold text-orange-600">{money(total)}</p>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
              {loading ? 'Đang tạo...' : 'Tạo hóa đơn'}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200">
              Đóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockMetaModal({ item, onClose, onDone }) {
  const [locations, setLocations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    vi_tri_kho: item?.vi_tri_kho || '',
    han_su_dung: item?.han_su_dung ? String(item.han_su_dung).slice(0, 10) : '',
    ngay_nhap_kho: item?.ngay_nhap_kho ? new Date(item.ngay_nhap_kho).toISOString().slice(0, 16) : '',
  });

  useEffect(() => {
    if (!item) return;
    warehouseAPI.getLocations(item.warehouse_id)
      .then(data => setLocations(data.locations || []))
      .catch(() => setLocations([]));
  }, [item]);

  if (!item) return null;

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await warehouseAPI.updateStockMeta(item.warehouse_id, item.ma_san_pham, {
        vi_tri_kho: form.vi_tri_kho || null,
        han_su_dung: form.han_su_dung || null,
        ngay_nhap_kho: form.ngay_nhap_kho ? `${form.ngay_nhap_kho.replace('T', ' ')}:00` : null,
      });
      onDone();
    } catch (err) {
      setError(err.message || 'Không cập nhật được thông tin lưu kho.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Cập nhật thông tin lưu kho</h2>
            <p className="mt-1 text-xs text-gray-400">{item.product_name} · {item.warehouse_name}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-600">×</button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Vị trí trong kho</label>
            <LocationSelect value={form.vi_tri_kho} onChange={value => setForm(prev => ({ ...prev, vi_tri_kho: value }))} locations={locations} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Hạn sử dụng</label>
              <input
                type="date"
                value={form.han_su_dung}
                onChange={event => setForm(prev => ({ ...prev, han_su_dung: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Ngày nhập kho</label>
              <input
                type="datetime-local"
                value={form.ngay_nhap_kho}
                onChange={event => setForm(prev => ({ ...prev, ngay_nhap_kho: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200">
              Đóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoiceDetailModal({ detail, loading, onClose, onConfirm, onCancel }) {
  const invoice = detail?.invoice;
  const items = detail?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Chi tiết hóa đơn kho</h2>
            <p className="mt-1 text-xs text-gray-400">Theo dõi từng dòng hàng, vị trí lưu và hạn sử dụng.</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-600">×</button>
        </div>

        {loading ? (
          <div className="space-y-4 p-6">
            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        ) : !invoice ? (
          <div className="p-10">
            <EmptyState text="Không tải được chi tiết hóa đơn." />
          </div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Số hóa đơn</p><p className="mt-1 text-sm font-semibold text-gray-800">{invoice.so_hoa_don}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Loại phiếu</p><div className="mt-2"><Badge text={invoice.loai_hoa_don === 'nhap_kho' ? 'Nhập kho' : 'Xuất kho'} tone={invoice.loai_hoa_don === 'nhap_kho' ? 'blue' : 'purple'} /></div></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Trạng thái</p><div className="mt-2"><Badge text={invoiceStatusText(invoice.trang_thai)} tone={invoiceStatusTone(invoice.trang_thai)} /></div></div>
              <div className="rounded-2xl bg-orange-50 p-4"><p className="text-xs text-orange-600">Tổng giá trị</p><p className="mt-1 text-xl font-bold text-orange-600">{money(invoice.tong_tien)}</p></div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-800">Thông tin vận hành</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-gray-400">Kho</p><p className="mt-1 font-medium text-gray-700">{invoice.warehouse_name}</p></div>
                  <div><p className="text-xs text-gray-400">Địa điểm</p><p className="mt-1 font-medium text-gray-700">{invoice.warehouse_location || 'Chưa cập nhật'}</p></div>
                  <div><p className="text-xs text-gray-400">Người tạo</p><p className="mt-1 font-medium text-gray-700">{invoice.created_by_name}</p></div>
                  <div><p className="text-xs text-gray-400">Liên hệ</p><p className="mt-1 font-medium text-gray-700">{invoice.created_by_email || 'Chưa cập nhật'}</p></div>
                  <div><p className="text-xs text-gray-400">Ngày tạo</p><p className="mt-1 font-medium text-gray-700">{dateTime(invoice.ngay_tao)}</p></div>
                  <div><p className="text-xs text-gray-400">Ngày xác nhận</p><p className="mt-1 font-medium text-gray-700">{invoice.ngay_xac_nhan ? dateTime(invoice.ngay_xac_nhan) : 'Chưa xác nhận'}</p></div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-800">Ghi chú</h3>
                <div className="mt-3 space-y-3 text-sm">
                  <div><p className="text-xs text-gray-400">Nội dung</p><p className="mt-1 text-gray-700">{invoice.ghi_chu || 'Không có ghi chú'}</p></div>
                  <div><p className="text-xs text-gray-400">Số dòng hàng</p><p className="mt-1 font-medium text-gray-700">{items.length} mặt hàng</p></div>
                  <div><p className="text-xs text-gray-400">Liên kết</p><p className="mt-1 text-gray-700">Mã đơn hàng: {invoice.ma_don_hang || 'Không liên kết'} · Mã nông dân: {invoice.ma_nong_dan || 'Không liên kết'}</p></div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-gray-800">Chi tiết mặt hàng</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      {['Sản phẩm', 'Số lượng', 'Đơn vị', 'Vị trí kho', 'Hạn sử dụng', 'Đơn giá', 'Thành tiền', 'Tồn toàn hệ thống'].map(header => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-600">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map(item => {
                      const expiry = expiryMeta(item.han_su_dung);
                      return (
                        <tr key={item.ma_chi_tiet}>
                          <td className="px-4 py-3"><p className="font-medium text-gray-800">{item.ten_san_pham}</p><p className="mt-1 text-xs text-gray-400">SP #{item.ma_san_pham}</p></td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{item.so_luong}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{item.don_vi}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{item.vi_tri_kho || 'Chưa gán vị trí'}</td>
                          <td className="px-4 py-3"><Badge text={expiry.text} tone={expiry.tone} /></td>
                          <td className="px-4 py-3 text-gray-700">{money(item.don_gia)}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{money(item.thanh_tien)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{item.tong_ton_toan_he_thong ?? 'Chưa rõ'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              {invoice.trang_thai === 'nhap' && (
                <>
                  <button onClick={() => onConfirm(invoice.ma_hoa_don)} className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700">
                    Xác nhận phiếu
                  </button>
                  <button onClick={() => onCancel(invoice.ma_hoa_don)} className="rounded-xl bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-100">
                    Hủy phiếu
                  </button>
                </>
              )}
              <button onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200">
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Warehouse() {
  const [tab, setTab] = useState('overview');
  const [warehouses, setWarehouses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [warehouseData, invoiceData, alertData, logData] = await Promise.all([
        warehouseAPI.getAll(),
        warehouseAPI.getInvoices(),
        warehouseAPI.getAlerts(),
        warehouseAPI.getLogs(),
      ]);

      const nextWarehouses = warehouseData.warehouses || [];
      setWarehouses(nextWarehouses);
      setInvoices(invoiceData.invoices || []);
      setAlerts(alertData.alerts || []);
      setLogs(logData.logs || []);

      const entries = await Promise.all(
        nextWarehouses.map(async warehouse => {
          try {
            const stockData = await warehouseAPI.getStock(warehouse.ma_kho);
            return [warehouse.ma_kho, stockData.stock || []];
          } catch {
            return [warehouse.ma_kho, []];
          }
        })
      );

      setStockMap(Object.fromEntries(entries));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const flatStock = useMemo(
    () =>
      warehouses.flatMap(warehouse =>
        (stockMap[warehouse.ma_kho] || []).map(item => ({
          ...item,
          warehouse_id: warehouse.ma_kho,
          warehouse_name: warehouse.ten_kho,
        }))
      ),
    [stockMap, warehouses]
  );

  const unresolvedAlerts = alerts.filter(alert => !alert.da_xu_ly).length;
  const nearExpiryCount = flatStock.filter(item => ['orange', 'red'].includes(expiryMeta(item.han_su_dung).tone)).length;
  const missingMetaCount = flatStock.filter(item => !item.vi_tri_kho || !item.han_su_dung).length;

  const filteredStock = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return flatStock.filter(item => {
      const matchesKeyword =
        !keyword ||
        item.product_name?.toLowerCase().includes(keyword) ||
        item.warehouse_name?.toLowerCase().includes(keyword) ||
        item.vi_tri_kho?.toLowerCase().includes(keyword);
      const matchesWarehouse = !warehouseFilter || String(item.warehouse_id) === String(warehouseFilter);
      return matchesKeyword && matchesWarehouse;
    });
  }, [flatStock, search, warehouseFilter]);

  const filteredInvoices = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return invoices.filter(invoice => {
      const matchesKeyword =
        !keyword ||
        invoice.so_hoa_don?.toLowerCase().includes(keyword) ||
        invoice.warehouse_name?.toLowerCase().includes(keyword);
      const matchesWarehouse = !warehouseFilter || String(invoice.ma_kho) === String(warehouseFilter);
      return matchesKeyword && matchesWarehouse;
    });
  }, [invoices, search, warehouseFilter]);

  const filteredAlerts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return alerts.filter(alert => {
      const matchesKeyword =
        !keyword ||
        alert.product_name?.toLowerCase().includes(keyword) ||
        alert.warehouse_name?.toLowerCase().includes(keyword);
      const matchesWarehouse = !warehouseFilter || String(alert.ma_kho) === String(warehouseFilter);
      return matchesKeyword && matchesWarehouse;
    });
  }, [alerts, search, warehouseFilter]);

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return logs.filter(log => {
      const matchesKeyword =
        !keyword ||
        log.product_name?.toLowerCase().includes(keyword) ||
        log.warehouse_name?.toLowerCase().includes(keyword);
      const matchesWarehouse = !warehouseFilter || String(log.ma_kho) === String(warehouseFilter);
      return matchesKeyword && matchesWarehouse;
    });
  }, [logs, search, warehouseFilter]);

  const openInvoiceDetail = async id => {
    setShowInvoiceDetail(true);
    setInvoiceDetail(null);
    setInvoiceDetailLoading(true);
    try {
      const data = await warehouseAPI.getInvoiceById(id);
      setInvoiceDetail(data);
    } catch {
      setInvoiceDetail(null);
    } finally {
      setInvoiceDetailLoading(false);
    }
  };

  const confirmInvoice = async id => {
    try {
      await warehouseAPI.confirmInvoice(id);
      await fetchAll();
      if (showInvoiceDetail) {
        const data = await warehouseAPI.getInvoiceById(id);
        setInvoiceDetail(data);
      }
    } catch {}
  };

  const cancelInvoice = async id => {
    try {
      await warehouseAPI.cancelInvoice(id);
      await fetchAll();
      if (showInvoiceDetail) {
        const data = await warehouseAPI.getInvoiceById(id);
        setInvoiceDetail(data);
      }
    } catch {}
  };

  const resolveAlert = async id => {
    try {
      await warehouseAPI.resolveAlert(id);
      setAlerts(prev => prev.map(alert => (alert.ma_canh_bao === id ? { ...alert, da_xu_ly: 1 } : alert)));
    } catch {}
  };

  const overviewMetrics = [
    { title: 'Kho hoạt động', value: warehouses.length, helper: 'Số kho đang được theo dõi', tone: 'blue' },
    { title: 'Dòng tồn kho', value: flatStock.length, helper: 'Tổng số dòng hàng trong các kho', tone: 'green' },
    { title: 'Cảnh báo mở', value: unresolvedAlerts, helper: 'Mặt hàng cần xử lý sớm', tone: 'orange' },
    { title: 'Sắp hết hạn', value: nearExpiryCount, helper: 'Lô hàng cần ưu tiên xuất trước', tone: 'red' },
  ];

  const tabs = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'invoices', label: `Hóa đơn (${filteredInvoices.length})` },
    { key: 'stock', label: `Tồn kho (${filteredStock.length})` },
    { key: 'alerts', label: `Cảnh báo (${filteredAlerts.length})` },
    { key: 'logs', label: `Lịch sử (${filteredLogs.length})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kho hàng và hóa đơn kho</h1>
            <p className="mt-1 text-sm text-gray-500">Theo dõi từng thực phẩm theo kho, vị trí lưu có sẵn và hạn sử dụng để quản lý chính xác hơn.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-orange-600">
            + Tạo hóa đơn kho
          </button>
        </div>

        <div className="mx-auto grid max-w-7xl gap-3 px-4 pb-4 md:grid-cols-3">
          <FilterInput value={search} onChange={setSearch} placeholder="Tìm sản phẩm, vị trí, kho hoặc hóa đơn..." />
          <select
            value={warehouseFilter}
            onChange={event => setWarehouseFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
          >
            <option value="">Tất cả kho</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.ma_kho} value={warehouse.ma_kho}>{warehouse.ten_kho}</option>
            ))}
          </select>
          <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700">
            <span>Cảnh báo mở</span>
            <span>{unresolvedAlerts}</span>
          </div>
        </div>

        {!!missingMetaCount && (
          <div className="mx-auto max-w-7xl px-4 pb-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Đang có {missingMetaCount} dòng tồn kho chưa đủ thông tin vị trí hoặc hạn sử dụng. Vào tab Tồn kho và bấm <span className="font-semibold">Cập nhật</span> để bổ sung nhanh.
            </div>
          </div>
        )}

        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {tabs.map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                tab === item.key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl border border-gray-100 bg-white" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {overviewMetrics.map(metric => <MetricCard key={metric.title} {...metric} />)}
            </div>

            {tab === 'overview' && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {warehouses.map(warehouse => {
                  const warehouseStock = stockMap[warehouse.ma_kho] || [];
                  const lowStockCount = warehouseStock.filter(item => item.is_low_stock).length;
                  const expiringSoon = warehouseStock.filter(item => ['orange', 'red'].includes(expiryMeta(item.han_su_dung).tone)).length;
                  const latestLog = logs.find(log => String(log.ma_kho) === String(warehouse.ma_kho));

                  return (
                    <div key={warehouse.ma_kho} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{warehouse.ten_kho}</h3>
                          <p className="mt-1 text-xs text-gray-400">{warehouse.dia_diem || 'Chưa cập nhật địa điểm'}</p>
                        </div>
                        <Badge text={warehouse.con_hoat_dong ? 'Hoạt động' : 'Tạm dừng'} tone={warehouse.con_hoat_dong ? 'green' : 'gray'} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Dòng tồn</p><p className="text-lg font-bold text-gray-800">{warehouseStock.length}</p></div>
                        <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Tổng số lượng</p><p className="text-lg font-bold text-gray-800">{warehouseStock.reduce((sum, item) => sum + Number(item.so_luong || 0), 0)}</p></div>
                        <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Sắp hết hàng</p><p className="text-lg font-bold text-orange-600">{lowStockCount}</p></div>
                        <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Sắp hết hạn</p><p className="text-lg font-bold text-red-600">{expiringSoon}</p></div>
                      </div>

                      <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-xs text-gray-500">
                        <p>Quản lý: <span className="font-medium text-gray-700">{warehouse.ten_quan_ly}</span></p>
                        <p>Số hóa đơn: <span className="font-medium text-gray-700">{invoices.filter(invoice => String(invoice.ma_kho) === String(warehouse.ma_kho)).length}</span></p>
                        <p>Biến động gần nhất: <span className="font-medium text-gray-700">{latestLog ? latestLog.product_name : 'Chưa có'}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'invoices' && (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr>
                        {['Số HĐ', 'Loại', 'Kho', 'Người tạo', 'Tổng tiền', 'Trạng thái', 'Ngày tạo', 'Hành động'].map(header => (
                          <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-600">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredInvoices.map(invoice => (
                        <tr key={invoice.ma_hoa_don} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{invoice.so_hoa_don}</td>
                          <td className="px-4 py-3"><Badge text={invoice.loai_hoa_don === 'nhap_kho' ? 'Nhập kho' : 'Xuất kho'} tone={invoice.loai_hoa_don === 'nhap_kho' ? 'blue' : 'purple'} /></td>
                          <td className="px-4 py-3 text-xs text-gray-600">{invoice.warehouse_name}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{invoice.created_by_name}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{money(invoice.tong_tien)}</td>
                          <td className="px-4 py-3"><Badge text={invoiceStatusText(invoice.trang_thai)} tone={invoiceStatusTone(invoice.trang_thai)} /></td>
                          <td className="px-4 py-3 text-xs text-gray-400">{dateTime(invoice.ngay_tao)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => openInvoiceDetail(invoice.ma_hoa_don)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">Chi tiết</button>
                              {invoice.trang_thai === 'nhap' ? (
                                <button onClick={() => confirmInvoice(invoice.ma_hoa_don)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">Xác nhận</button>
                              ) : (
                                <span className="px-3 py-1.5 text-xs text-gray-400">Đã khóa</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!filteredInvoices.length && <EmptyState text="Không có hóa đơn phù hợp bộ lọc." />}
              </div>
            )}

            {tab === 'stock' && (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr>
                        {['Sản phẩm', 'Kho', 'Số lượng', 'Vị trí kho', 'Hạn sử dụng', 'Mức tối thiểu', 'Trạng thái', 'Ngày nhập', 'Thao tác'].map(header => (
                          <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-600">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredStock.map(item => {
                        const expiry = expiryMeta(item.han_su_dung);
                        return (
                          <tr key={`${item.warehouse_id}-${item.ma_san_pham}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3"><p className="font-medium text-gray-800">{item.product_name}</p><p className="mt-1 text-xs text-gray-400">{item.unit}</p></td>
                            <td className="px-4 py-3 text-xs text-gray-600">{item.warehouse_name}</td>
                            <td className={cn('px-4 py-3 font-semibold', item.is_low_stock ? 'text-orange-600' : 'text-gray-800')}>{item.so_luong}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">{item.vi_tri_kho || 'Chưa gán vị trí'}</td>
                            <td className="px-4 py-3"><Badge text={expiry.text} tone={expiry.tone} /></td>
                            <td className="px-4 py-3 text-xs text-gray-500">{item.min_stock}</td>
                            <td className="px-4 py-3"><Badge text={item.is_low_stock ? 'Sắp hết hàng' : 'Ổn định'} tone={item.is_low_stock ? 'orange' : 'green'} /></td>
                            <td className="px-4 py-3 text-xs text-gray-500">{item.ngay_nhap_kho ? dateTime(item.ngay_nhap_kho) : 'Chưa rõ'}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => setEditingStock(item)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
                                Cập nhật
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!filteredStock.length && <EmptyState text="Không có tồn kho phù hợp bộ lọc." />}
              </div>
            )}

            {tab === 'alerts' && (
              <div className="space-y-3">
                {!filteredAlerts.length ? (
                  <EmptyState text="Không có cảnh báo phù hợp bộ lọc." />
                ) : (
                  filteredAlerts.map(alert => (
                    <div key={alert.ma_canh_bao} className={cn('flex items-center gap-4 rounded-2xl border p-4', alert.da_xu_ly ? 'border-gray-100 bg-gray-50 opacity-70' : 'border-orange-200 bg-orange-50')}>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl">{alert.da_xu_ly ? '✓' : '!'}</div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{alert.product_name}</p>
                        <p className="mt-1 text-xs text-gray-500">Kho {alert.warehouse_name} · Tồn hiện tại <span className="font-semibold text-orange-600">{alert.ton_hien_tai}</span> / Mức tối thiểu {alert.ton_toi_thieu}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{dateTime(alert.ngay_tao)}</p>
                        {!alert.da_xu_ly && (
                          <button onClick={() => resolveAlert(alert.ma_canh_bao)} className="mt-2 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                            Đánh dấu đã xử lý
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'logs' && (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr>
                        {['Thời gian', 'Sản phẩm', 'Kho', 'Loại', 'Biến động', 'Tồn trước → sau'].map(header => (
                          <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-600">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredLogs.map(log => (
                        <tr key={log.ma_lich_su} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs text-gray-400">{dateTime(log.ngay_tao)}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{log.product_name}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{log.warehouse_name}</td>
                          <td className="px-4 py-3"><Badge text={log.loai_phieu === 'nhap_kho' ? 'Nhập kho' : 'Xuất kho'} tone={log.loai_phieu === 'nhap_kho' ? 'blue' : 'purple'} /></td>
                          <td className={cn('px-4 py-3 font-semibold', log.loai_phieu === 'nhap_kho' ? 'text-blue-600' : 'text-purple-600')}>{log.loai_phieu === 'nhap_kho' ? '+' : '-'}{log.so_luong}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{log.ton_truoc} → <span className="font-semibold text-gray-700">{log.ton_sau}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!filteredLogs.length && <EmptyState text="Không có lịch sử phù hợp bộ lọc." />}
              </div>
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <InvoiceModal
          warehouses={warehouses}
          onClose={() => setShowCreateModal(false)}
          onDone={() => {
            setShowCreateModal(false);
            fetchAll();
          }}
        />
      )}

      {editingStock && (
        <StockMetaModal
          item={editingStock}
          onClose={() => setEditingStock(null)}
          onDone={() => {
            setEditingStock(null);
            fetchAll();
          }}
        />
      )}

      {showInvoiceDetail && (
        <InvoiceDetailModal
          detail={invoiceDetail}
          loading={invoiceDetailLoading}
          onClose={() => {
            setShowInvoiceDetail(false);
            setInvoiceDetail(null);
          }}
          onConfirm={confirmInvoice}
          onCancel={cancelInvoice}
        />
      )}
    </div>
  );
}
