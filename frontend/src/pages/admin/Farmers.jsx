import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { Badge, Btn, Loading, Modal, SearchBar, StatCard, Table } from '../../components/ui/AdminUI';

function FarmerDetailModal({ farmer, onClose, onVerify }) {
  return (
    <Modal title={`Chi tiết nông trại: ${farmer.ten_nong_trai || 'Chưa đặt tên'}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-xl bg-green-50 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white">
            {farmer.ho_ten?.charAt(0) || 'N'}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{farmer.ho_ten || 'Nông dân'}</h3>
            <p className="text-sm text-green-700">{farmer.ten_nong_trai || 'Chưa cập nhật tên nông trại'}</p>
            <div className="mt-2">
              <Badge text={farmer.da_xac_minh ? 'Đã xác minh' : 'Chờ duyệt'} color={farmer.da_xac_minh ? 'green' : 'yellow'} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Email', farmer.email],
            ['Số điện thoại', farmer.so_dien_thoai || 'Chưa cập nhật'],
            ['Tỉnh thành', farmer.tinh_thanh || 'Chưa cập nhật'],
            ['Quận / huyện', farmer.quan_huyen || 'Chưa cập nhật'],
            ['Ngày tạo', farmer.ngay_tao ? new Date(farmer.ngay_tao).toLocaleDateString('vi-VN') : 'Chưa có'],
            ['Điểm đánh giá', `${farmer.diem_danh_gia || 0}/5`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="mt-1 font-medium text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {farmer.gioi_thieu && (
          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
            <p className="text-xs text-gray-400">Giới thiệu</p>
            <p className="mt-1 whitespace-pre-line">{farmer.gioi_thieu}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {!farmer.da_xac_minh && (
            <Btn variant="primary" className="flex-1 justify-center" onClick={() => onVerify(farmer.ma_nong_dan)}>
              Duyệt nông trại
            </Btn>
          )}
          <Btn variant="outline" className="flex-1 justify-center" onClick={onClose}>
            Đóng
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (filter !== 'all') params.set('da_xac_minh', filter === 'verified' ? '1' : '0');

      const data = await api.get(`/admin/farmers?${params.toString()}`);
      setFarmers(data.farmers || []);
    } catch {
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, [search, filter]);

  const stats = useMemo(() => {
    const verified = farmers.filter(farmer => farmer.da_xac_minh).length;
    const pending = farmers.length - verified;

    return { total: farmers.length, verified, pending };
  }, [farmers]);

  const handleVerify = async farmerId => {
    await api.patch(`/admin/farmers/${farmerId}/verify`);
    setFarmers(prev => prev.map(farmer => (farmer.ma_nong_dan === farmerId ? { ...farmer, da_xac_minh: 1 } : farmer)));
    setSelected(prev => (prev?.ma_nong_dan === farmerId ? { ...prev, da_xac_minh: 1 } : prev));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon="🌾" label="Tổng nông dân" value={stats.total} color="green" />
        <StatCard icon="✅" label="Đã xác minh" value={stats.verified} color="blue" />
        <StatCard icon="⏳" label="Chờ duyệt" value={stats.pending} color="orange" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên nông dân hoặc nông trại..." />
        <div className="flex rounded-xl bg-gray-100 p-1">
          {[
            ['all', 'Tất cả'],
            ['pending', 'Chờ duyệt'],
            ['verified', 'Đã xác minh'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === value ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <Table
          headers={['Nông dân', 'Nông trại', 'Khu vực', 'Email', 'Số điện thoại', 'Trạng thái', 'Ngày tham gia', 'Thao tác']}
          empty={{ icon: '🌾', text: 'Không tìm thấy hồ sơ nông dân nào' }}
        >
          {farmers.map(farmer => (
            <tr key={farmer.ma_nong_dan} className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                    {farmer.ho_ten?.charAt(0) || 'N'}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{farmer.ho_ten}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{farmer.ten_nong_trai || 'Chưa cập nhật'}</td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {[farmer.tinh_thanh, farmer.quan_huyen].filter(Boolean).join(', ') || 'Chưa cập nhật'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{farmer.email}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{farmer.so_dien_thoai || 'Chưa cập nhật'}</td>
              <td className="px-4 py-3">
                <Badge text={farmer.da_xac_minh ? 'Đã xác minh' : 'Chờ duyệt'} color={farmer.da_xac_minh ? 'green' : 'yellow'} />
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">{new Date(farmer.ngay_tao).toLocaleDateString('vi-VN')}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Btn size="sm" variant="outline" onClick={() => setSelected(farmer)}>
                    Xem
                  </Btn>
                  {!farmer.da_xac_minh && (
                    <Btn size="sm" variant="primary" onClick={() => handleVerify(farmer.ma_nong_dan)}>
                      Duyệt
                    </Btn>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {selected && (
        <FarmerDetailModal
          farmer={selected}
          onClose={() => setSelected(null)}
          onVerify={handleVerify}
        />
      )}
    </div>
  );
}
