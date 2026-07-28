import { Link } from 'react-router-dom';
import { Globe, Mail, Phone, Send } from 'lucide-react';

export default function MarketFooter() {
  return (
    <footer className="bg-card border-t border-border py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <Link to="/" className="text-h2 font-bold text-primary block mb-4">Chợ Nông Sản</Link>
          <p className="text-text-secondary text-body mb-6">Kết nối giá trị nông sản Việt, mang tinh hoa đất trời đến tận gian bếp của mọi gia đình.</p>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#"><Globe size={18} /></a>
            <a className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#"><Mail size={18} /></a>
            <a className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#"><Phone size={18} /></a>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-h4 text-text-primary mb-6">Sản phẩm</h4>
          <ul className="space-y-4">
            <li><a className="text-text-secondary hover:text-primary transition-colors text-body" href="#">Rau củ tươi</a></li>
            <li><a className="text-text-secondary hover:text-primary transition-colors text-body" href="#">Trái cây đặc sản</a></li>
            <li><a className="text-text-secondary hover:text-primary transition-colors text-body" href="#">Gạo & Ngũ cốc</a></li>
            <li><a className="text-text-secondary hover:text-primary transition-colors text-body" href="#">Thực phẩm sạch</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-h4 text-text-primary mb-6">Công ty</h4>
          <ul className="space-y-4">
            <li><Link to="/about" className="text-text-secondary hover:text-primary transition-colors text-body">Về chúng tôi</Link></li>
            <li><span className="text-text-secondary hover:text-primary transition-colors text-body cursor-pointer">Chính sách bảo mật</span></li>
            <li><span className="text-text-secondary hover:text-primary transition-colors text-body cursor-pointer">Liên hệ</span></li>
            <li><span className="text-text-secondary hover:text-primary transition-colors text-body cursor-pointer">Câu hỏi thường gặp</span></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-h4 text-text-primary mb-6">Bản tin</h4>
          <p className="text-text-secondary text-body mb-4">Đăng ký để nhận ưu đãi và tin tức mới nhất từ nông trại.</p>
          <div className="flex gap-2">
            <input className="flex-grow bg-background border border-border rounded-btn px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-body" placeholder="Email của bạn" type="email" />
            <button className="bg-primary text-white px-4 py-3 rounded-btn hover:bg-primary-dark transition-all"><Send size={18} /></button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-16 mt-16 pt-8 border-t border-border text-center">
        <p className="text-text-secondary text-caption">© 2024 Chợ Nông Sản. Kết nối giá trị nông sản Việt. Tất cả quyền được bảo lưu.</p>
      </div>
    </footer>
  );
}
