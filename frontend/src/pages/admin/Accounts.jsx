import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Badge, Btn, Loading, PageHero, Pagination, SearchBar, Table } from '../../components/ui/AdminUI';

const roleMap = {
  quan_tri: { label: 'Admin', color: 'purple' },
  nguoi_mua: { label: 'Người mua', color: 'blue' },
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

  const fetchAccounts = async () => {
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
    fetchAccounts();
  }, [page, role, search]);

  const toggleActive = async (id, current) => {
    try {
      await api.patch(`/admin/accounts/${id}/toggle`);
      setAccounts(prev => prev.map(account => (account.ma_tai_khoan === id ? { ...account, con_hoat_dong: !current } : account)));
    } catch (err) {
      setError(err.message || 'Không cập nhật được trạng thái tài khoản.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Tài khoản"
        title="Quản lý tài khoản người dùng"
        body="Theo dõi tài khoản hiện có trên hệ thống, lọc theo vai trò và khóa hoặc mở khóa khi cần."
      />

      <div className="market-panel p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchBar value={search} onChange={value => { setSearch(value); setPage(1); }} placeholder="Tìm tên hoặc email..." />
          <select
            value={role}
            onChange={event => { setRole(event.target.value); setPage(1); }}
            className="rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
          >
            <option value="">Tất cả vai trò</option>
            <option value="quan_tri">Admin</option>
            <option value="nguoi_mua">Người mua</option>
          </select>
          <div className="ml-auto text-sm text-slate-500">
            Tổng tài khoản: <span className="font-semibold text-slate-900">{total}</span>
          </div>
        </div>
      </div>

      {error ? <div className="market-panel px-5 py-4 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <Loading />
      ) : (
        <Table
          headers={['#', 'Họ tên', 'Email', 'Số điện thoại', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Hành động']}
          empty={{ icon: '👤', text: 'Không tìm thấy tài khoản nào.' }}
        >
          {accounts.map((account, index) => {
            const roleInfo = roleMap[account.vai_tro] || { label: account.vai_tro, color: 'gray' };
            return (
              <tr key={account.ma_tai_khoan} className="hover:bg-[#f9fbf9]">
                <td className="px-4 py-3 text-xs text-slate-400">{(page - 1) * limit + index + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f5ee] text-sm font-bold text-[#1a7a4a]">
                      {account.ho_ten?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{account.ho_ten}</p>
                      <p className="text-xs text-slate-400">ID {account.ma_tai_khoan}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{account.email}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{account.so_dien_thoai || 'Chưa cập nhật'}</td>
                <td className="px-4 py-3"><Badge text={roleInfo.label} color={roleInfo.color} /></td>
                <td className="px-4 py-3">
                  <Badge text={account.con_hoat_dong ? 'Hoạt động' : 'Đã khóa'} color={account.con_hoat_dong ? 'green' : 'red'} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {account.ngay_tao ? new Date(account.ngay_tao).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                </td>
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
            );
          })}
        </Table>
      )}

      <Pagination page={page} total={total} limit={limit} onChange={setPage} />
    </div>
  );
}
