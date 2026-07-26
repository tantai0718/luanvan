import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Badge, Btn, Loading, PageHero, Pagination, SearchBar, Table } from '../../components/ui/AdminUI';
import * as XLSX from 'xlsx';

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
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (search) params.set('q', search);
      if (role) params.set('vai_tro', role);
      const data = await api.get(`/admin/accounts?${params.toString()}`);
      setAccounts(data.accounts || []);
      setTotal(data.total || 0);
    } catch (err) { setAccounts([]); setTotal(0); setError(err.message || 'Không tải được danh sách tài khoản.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, [page, role, search]);

  const exportExcel = async () => {
    let data = accounts;
    if (total > accounts.length) {
      try { const res = await api.get(`/admin/accounts?limit=${total}`); data = res.accounts || []; } catch {}
    }
    const rows = data.map((a, i) => ({
      'STT': i + 1,
      'Họ tên': a.ho_ten,
      'Email': a.email,
      'Số điện thoại': a.so_dien_thoai || '',
      'Vai trò': roleMap[a.vai_tro]?.label || a.vai_tro,
      'Trạng thái': a.con_hoat_dong ? 'Hoạt động' : 'Đã khóa',
      'Ngày tạo': a.ngay_tao ? new Date(a.ngay_tao).toLocaleDateString('vi-VN') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tai khoan');
    const now = new Date();
    const fileName = `tai_khoan_${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}.xlsx`;
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({ suggestedName: fileName, types: [{ description: 'Excel file', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }] });
        const bin = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([bin], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (e) { if (e.name !== 'AbortError') alert('Không thể lưu file.'); }
    } else { XLSX.writeFile(wb, fileName); }
  };

  const toggleActive = async (id, current) => {
    try { await api.patch(`/admin/accounts/${id}/toggle`); setAccounts(prev => prev.map(account => (account.ma_tai_khoan === id ? { ...account, con_hoat_dong: !current } : account))); }
    catch (err) { setError(err.message || 'Không cập nhật được trạng thái tài khoản.'); }
  };

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Tài khoản" title="Quản lý tài khoản người dùng" body="Theo dõi tài khoản hiện có trên hệ thống, lọc theo vai trò và khóa hoặc mở khóa khi cần." />

      <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm tên hoặc email..." />
          <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed">
            <option value="">Tất cả vai trò</option>
            <option value="quan_tri">Admin</option>
            <option value="nguoi_mua">Người mua</option>
          </select>
          <div className="ml-auto flex items-center gap-3">
            <Btn variant="outline" onClick={exportExcel} disabled={!accounts.length}>
              <span className="material-symbols-outlined text-sm mr-1">download</span> Xuất Excel
            </Btn>
            <span className="text-body-md text-on-surface-variant">Tổng tài khoản: <span className="font-bold text-on-surface">{total}</span></span>
          </div>
        </div>
      </div>

      {error && <div className="bg-surface rounded-3xl p-lg border border-outline-variant text-body-md text-on-error-container bg-error-container/20">{error}</div>}

      {loading ? <Loading /> : (
          <Table headers={['#', 'Họ tên', 'Email', 'Số điện thoại', 'Vai trò', 'Trạng thái', 'Hành động']} empty={{ icon: '👤', text: 'Không tìm thấy tài khoản nào.' }}>
          {accounts.map((account, index) => {
            const roleInfo = roleMap[account.vai_tro] || { label: account.vai_tro, color: 'gray' };
            return (
              <tr key={account.ma_tai_khoan} className="hover:bg-surface-container-low">
                <td className="px-4 py-3 text-label-sm text-on-surface-variant">{(page - 1) * limit + index + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-title-md font-bold text-on-primary-fixed-variant">{account.ho_ten?.charAt(0) || 'U'}</div>
                    <div>
                      <p className="text-title-md font-title-md text-on-surface">{account.ho_ten}</p>
                      <p className="text-label-sm text-on-surface-variant">ID {account.ma_tai_khoan}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-body-md text-on-surface-variant">{account.email}</td>
                <td className="px-4 py-3 text-body-md text-on-surface-variant">{account.so_dien_thoai || 'Chưa cập nhật'}</td>
                <td className="px-4 py-3"><Badge text={roleInfo.label} color={roleInfo.color} /></td>
                <td className="px-4 py-3"><Badge text={account.con_hoat_dong ? 'Hoạt động' : 'Đã khóa'} color={account.con_hoat_dong ? 'green' : 'red'} /></td>
                <td className="px-4 py-3"><Btn size="sm" variant={account.con_hoat_dong ? 'danger' : 'primary'} onClick={() => toggleActive(account.ma_tai_khoan, account.con_hoat_dong)}>{account.con_hoat_dong ? 'Khóa' : 'Mở khóa'}</Btn></td>
              </tr>
            );
          })}
        </Table>
      )}

      <Pagination page={page} total={total} limit={limit} onChange={setPage} />
    </div>
  );
}
