import { Link } from 'react-router-dom';

export default function MarketFooter() {
  return (
    <footer className="border-t border-[#2d6a4f] bg-[#042f22] text-white">
      <div className="market-page grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="text-2xl font-bold text-[#0f5238]">Farm2Table</Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/75">
            Cung cấp nông sản sạch từ tâm, kết nối bữa ăn gia đình với nguồn hàng rõ ràng.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-bold uppercase text-[#b1f0ce]">Khám phá</p>
          <Link to="/products" className="block text-white/75 hover:text-white">Sản phẩm mới</Link>
          <Link to="/about" className="block text-white/75 hover:text-white">Câu chuyện thương hiệu</Link>
          <Link to="/orders" className="block text-white/75 hover:text-white">Quản lý đơn hàng</Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-bold uppercase text-[#b1f0ce]">Hỗ trợ</p>
          <span className="block text-white/75">Chính sách bảo mật</span>
          <span className="block text-white/75">Điều khoản sử dụng</span>
          <span className="block text-white/75">Hướng dẫn mua hàng</span>
        </div>
        <div>
          <p className="font-bold uppercase text-[#b1f0ce]">Bản tin</p>
          <p className="mt-3 text-sm leading-6 text-white/75">Nhận ưu đãi và thông tin mùa vụ mới nhất.</p>
          <div className="mt-4 flex overflow-hidden rounded-lg border border-[#2d6a4f] bg-white/10">
            <input className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/60" placeholder="Email của bạn" />
            <button className="bg-[#b1f0ce] px-4 text-[#063d2b]" aria-label="Đăng ký bản tin">
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      </div>
      <p className="border-t border-[#2d6a4f] py-5 text-center text-xs text-white/65">
        © 2026 Farm2Table. Cung cấp nông sản sạch từ tâm.
      </p>
    </footer>
  );
}
