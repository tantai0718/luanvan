import { Link } from 'react-router-dom';

export default function MarketFooter() {
  return (
    <footer className="border-t border-[#d7ddd8] bg-white">
      <div className="market-page grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="text-2xl font-bold text-[#0f5238]">Farm2Table</Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-[#404943]">
            Cung cấp nông sản sạch từ tâm, kết nối bữa ăn gia đình với nguồn hàng rõ ràng.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-bold uppercase text-[#0f5238]">Khám phá</p>
          <Link to="/products" className="block text-[#404943] hover:text-[#0f5238]">Sản phẩm mới</Link>
          <Link to="/about" className="block text-[#404943] hover:text-[#0f5238]">Câu chuyện thương hiệu</Link>
          <Link to="/orders" className="block text-[#404943] hover:text-[#0f5238]">Quản lý đơn hàng</Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-bold uppercase text-[#0f5238]">Hỗ trợ</p>
          <span className="block text-[#404943]">Chính sách bảo mật</span>
          <span className="block text-[#404943]">Điều khoản sử dụng</span>
          <span className="block text-[#404943]">Hướng dẫn mua hàng</span>
        </div>
        <div>
          <p className="font-bold uppercase text-[#0f5238]">Bản tin</p>
          <p className="mt-3 text-sm leading-6 text-[#404943]">Nhận ưu đãi và thông tin mùa vụ mới nhất.</p>
          <div className="mt-4 flex overflow-hidden rounded-lg border border-[#d7ddd8] bg-[#f5f3f3]">
            <input className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" placeholder="Email của bạn" />
            <button className="bg-[#0f5238] px-4 text-white" aria-label="Đăng ký bản tin">
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      </div>
      <p className="border-t border-[#edf0ed] py-5 text-center text-xs text-[#404943]">
        © 2026 Farm2Table. Cung cấp nông sản sạch từ tâm.
      </p>
    </footer>
  );
}
