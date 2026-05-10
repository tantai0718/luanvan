import { useEffect, useState } from 'react';
import { productAPI } from '../../services/api';
import { Badge, Btn, Loading, Pagination, SearchBar, Table } from '../../components/ui/AdminUI';

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (search) params.set('q', search);

      const data = await productAPI.getAll(`?${params.toString()}`);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, page]);

  const handleToggle = async id => {
    await productAPI.toggle(id);
    setProducts(prev =>
      prev.map(product =>
        product.ma_san_pham === id ? { ...product, con_hoat_dong: !product.con_hoat_dong } : product
      )
    );
  };

  const handleDelete = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này không?')) return;
    await productAPI.delete(id);
    fetchProducts();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={value => { setSearch(value); setPage(1); }} placeholder="Tìm tên sản phẩm..." />
        <span className="ml-auto text-sm text-gray-500">
          Tổng sản phẩm: <b>{total}</b>
        </span>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <Table
          headers={['#', 'Sản phẩm', 'Nông trại', 'Danh mục', 'Giá bán', 'Tồn kho', 'Đánh giá', 'Trạng thái', 'Thao tác']}
          empty={{ icon: '🥬', text: 'Không tìm thấy sản phẩm nào' }}
        >
          {products.map((product, index) => {
            const image = product.images?.[0];
            const isLowStock = Number(product.ton_kho) <= Number(product.ton_kho_toi_thieu || 0);

            return (
              <tr key={product.ma_san_pham} className="transition-colors hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-400">{(page - 1) * limit + index + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {image ? (
                      <img src={image} alt={product.ten_san_pham} className="h-10 w-10 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-base">🥬</div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">{product.ten_san_pham}</p>
                      <p className="text-xs text-gray-400">Đơn vị: {product.don_vi}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{product.ten_nong_trai || product.ten_nong_dan || 'Chưa cập nhật'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {product.bieu_tuong ? `${product.bieu_tuong} ` : ''}
                  {product.ten_danh_muc || 'Khác'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-green-700">{formatCurrency(product.gia_ban)}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-semibold ${isLowStock ? 'text-orange-500' : 'text-gray-700'}`}>
                    {product.ton_kho}
                    {isLowStock && ' ⚠'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {Number(product.diem_danh_gia) > 0 ? `${Number(product.diem_danh_gia).toFixed(1)} / 5` : 'Chưa có'}
                </td>
                <td className="px-4 py-3">
                  <Badge text={product.con_hoat_dong ? 'Đang hiển thị' : 'Đã ẩn'} color={product.con_hoat_dong ? 'green' : 'gray'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Btn size="sm" variant={product.con_hoat_dong ? 'outline' : 'primary'} onClick={() => handleToggle(product.ma_san_pham)}>
                      {product.con_hoat_dong ? 'Ẩn' : 'Hiện'}
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={() => handleDelete(product.ma_san_pham)}>
                      Xóa
                    </Btn>
                  </div>
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
