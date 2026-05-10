import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Badge, Btn, Loading, Pagination, SearchBar, Table } from '../../components/ui/AdminUI';

const ROLE_MAP = {
  quan_tri: 'Admin',
  nong_dan: 'Nông dân',
  nguoi_mua: 'Người mua',
};

const ROLE_COLOR = {
  quan_tri: 'purple',
  nong_dan: 'green',
  nguoi_mua: 'blue',
};

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const limit = 15;

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (search) params.set('q', search);
      if (role) params.set('vai_tro', role);

      const data = await api.get(`/admin/accounts?${params.toString()}`);
      setAccounts(data.accounts || []);
      setTotal(data.total || 0);
    } catch (err) {
      setAccounts([]);
      setTotal(0);
      setError(err.message || 'Không tải được danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, role, page]);

  const toggleActive = async (id, current) => {
    try {
      await api.patch(`/admin/accounts/${id}/toggle`);
      setAccounts(prev =>
        prev.map(account =>
          account.ma_tai_khoan === id ? { ...account, con_hoat_dong: !current } : account
        )
      );
    } catch (err) {
      setError(err.message || 'Không cập nhật được trạng thái tài khoản.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={value => { setSearch(value); setPage(1); }} placeholder="Tìm tên hoặc email..." />
        <select
          value={role}
          onChange={event => { setRole(event.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="">Tất cả vai trò</option>
          <option value="quan_tri">Admin</option>
          <option value="nong_dan">Nông dân</option>
          <option value="nguoi_mua">Người mua</option>
        </select>
        <span className="ml-auto text-sm text-gray-500">
          Tổng: <b>{total}</b>
        </span>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <Table
          headers={['#', 'Họ tên', 'Email', 'Số điện thoại', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Hành động']}
          empty={{ icon: '👥', text: 'Không tìm thấy tài khoản nào' }}
        >
          {accounts.map((account, index) => (
            <tr key={account.ma_tai_khoan} className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-3 text-xs text-gray-400">{(page - 1) * limit + index + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                    {account.ho_ten?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{account.ho_ten}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">{account.email}</td>
              <td className="px-4 py-3 text-xs text-gray-500">{account.so_dien_thoai || 'Chưa cập nhật'}</td>
              <td className="px-4 py-3">
                <Badge text={ROLE_MAP[account.vai_tro] || account.vai_tro} color={ROLE_COLOR[account.vai_tro] || 'gray'} />
              </td>
              <td className="px-4 py-3">
                <Badge text={account.con_hoat_dong ? 'Hoạt động' : 'Đã khóa'} color={account.con_hoat_dong ? 'green' : 'red'} />
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">{new Date(account.ngay_tao).toLocaleDateString('vi-VN')}</td>
              <td className="px-4 py-3">
                <Btn
                  size="sm"
                  variant={account.con_hoat_dong ? 'danger' : 'primary'}
                  onClick={() => toggleActive(account.ma_tai_khoan, account.con_hoat_dong)}
                >
                  {account.con_hoat_dong ? 'Khóa' : 'Mở khóa'}
                </Btn>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Pagination page={page} total={total} limit={limit} onChange={setPage} />
    </div>
  );
}
