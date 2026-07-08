import { Link } from 'react-router-dom';

export default function MarketFooter() {
  return (
    <footer className="bg-surface-container-highest border-t border-outline-variant py-xl">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <Link to="/" className="text-headline-lg font-headline-lg text-primary block mb-4">
            Chợ Nông Sản
          </Link>
          <p className="text-on-surface-variant font-body-md text-body-md mb-6">
            Kết nối giá trị nông sản Việt, mang tinh hoa đất trời đến tận gian bếp của mọi gia đình.
          </p>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
              <span className="material-symbols-outlined">public</span>
            </a>
            <a className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
              <span className="material-symbols-outlined">mail</span>
            </a>
            <a className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
              <span className="material-symbols-outlined">phone</span>
            </a>
          </div>
        </div>
        <div>
          <h4 className="font-title-md text-title-md text-on-surface mb-6">Sản phẩm</h4>
          <ul className="space-y-4">
            <li><a className="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md" href="#">Rau củ tươi</a></li>
            <li><a className="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md" href="#">Trái cây đặc sản</a></li>
            <li><a className="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md" href="#">Gạo & Ngũ cốc</a></li>
            <li><a className="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md" href="#">Thực phẩm sạch</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-title-md text-title-md text-on-surface mb-6">Công ty</h4>
          <ul className="space-y-4">
            <li><Link to="/about" className="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md">Về chúng tôi</Link></li>
            <li><span className="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md cursor-pointer">Chính sách bảo mật</span></li>
            <li><span className="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md cursor-pointer">Liên hệ</span></li>
            <li><span className="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md cursor-pointer">Câu hỏi thường gặp</span></li>
          </ul>
        </div>
        <div>
          <h4 className="font-title-md text-title-md text-on-surface mb-6">Bản tin</h4>
          <p className="text-on-surface-variant font-body-md text-body-md mb-4">Đăng ký để nhận ưu đãi và tin tức mới nhất từ nông trại.</p>
          <div className="flex gap-2">
            <input
              className="flex-grow bg-surface border border-outline-variant rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-body-md"
              placeholder="Email của bạn"
              type="email"
            />
            <button className="bg-primary text-on-primary px-4 py-2 rounded-xl hover:opacity-90 transition-all">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop mt-16 pt-8 border-t border-outline-variant text-center">
        <p className="text-on-surface-variant font-label-sm text-label-sm">© 2024 Chợ Nông Sản. Kết nối giá trị nông sản Việt. Tất cả quyền được bảo lưu.</p>
      </div>
    </footer>
  );
}
