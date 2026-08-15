import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { Send, X, MessageCircle } from 'lucide-react';
import { getExpiryDiscountPrice } from '../utils/expiryDiscount';

const BACKEND = 'http://localhost:5000';
const formatCurrency = v => `${Number(v || 0).toLocaleString('vi-VN')}đ`;

function ProductCard({ product, onClick }) {
  const img = product.hinh_anh ? `${BACKEND}${product.hinh_anh}` : '/images/placeholder.png';
  const discounted = getExpiryDiscountPrice(product);
  const isPreview = product.la_du_bao;
  const displayedPrice = isPreview
    ? product.gia_du_kien
    : (discounted != null ? discounted : product.gia_ban);

  if (isPreview) {
    return (
      <div className="flex w-full items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-left">
        <img src={img} alt={product.ten_san_pham} className="h-12 w-12 flex-shrink-0 rounded-md object-cover opacity-80" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">{product.ten_san_pham}</p>
          <p className="text-xs font-medium text-amber-800">Sắp vào mùa · chỉ tham khảo</p>
          <p className="text-sm font-semibold text-primary">Dự kiến: {displayedPrice != null ? formatCurrency(displayedPrice) : 'Đang cập nhật'}</p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!product.co_the_mua}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-white p-2 text-left transition hover:border-primary hover:shadow disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:shadow-none"
    >
      <img src={img} alt={product.ten_san_pham} className="h-12 w-12 flex-shrink-0 rounded-md object-cover" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{product.ten_san_pham}</p>
        <p className="text-sm font-semibold text-primary">{formatCurrency(displayedPrice)}</p>
        {!product.co_the_mua && <p className="text-xs text-text-secondary">Tạm hết hàng</p>}
      </div>
    </button>
  );
}

export default function ChatBox() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  const loadMessages = async () => {
    try {
      const res = await chatAPI.getMessages();
      setMessages(res.messages || []);
    } catch (err) {
      console.log(err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const question = input;

    setMessages(prev => [...prev, { vai_tro: 'user', noi_dung: question, products: [] }]);
    setInput('');
    setLoading(true);

    try {
      await chatAPI.sendMessage({ noi_dung: question });
      await loadMessages();
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn chat:", err);
      setMessages(prev => [
        ...prev,
        { vai_tro: 'bot', noi_dung: 'Có lỗi xảy ra, vui lòng thử lại.', products: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadMessages();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages]);

  const handleKeyDown = e => {
    if (e.key === 'Enter') sendMessage();
  };

  const goToProduct = masp => {
    setOpen(false);
    navigate(`/products/${masp}`);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-xl">
          <div className="bg-primary px-4 py-3 font-medium text-white flex items-center justify-between">
            <span>Trợ lý mua sắm</span>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            {messages.map((m, idx) => (
              <div key={m.matnc || idx} className={`max-w-[92%] ${m.vai_tro === 'user' ? 'self-end' : 'self-start'}`}>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm whitespace-pre-line ${m.vai_tro === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'
                       }`}
                      >
                        {m.noi_dung}
                  </div>

                {m.products?.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2">
                    {m.products.map(p => (
                      <ProductCard key={p.masp} product={p} onClick={() => goToProduct(p.masp)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="text-xs text-text-secondary">Đang tìm sản phẩm...</div>}
            <div ref={bottomRef} />
          </div>

          <div className="flex border-t border-border">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi... vd: tìm xoài"
              className="flex-1 px-3 py-2.5 text-sm outline-none placeholder:text-text-secondary"
            />
            <button
              onClick={sendMessage}
              className="bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Đóng hộp trò chuyện' : 'Mở hộp trò chuyện'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary/90"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
