import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';

const BACKEND = 'http://localhost:5000';
const formatCurrency = v => `${Number(v || 0).toLocaleString('vi-VN')}đ`;

function ProductCard({ product, onClick }) {
  const img = product.hinh_anh ? `${BACKEND}${product.hinh_anh}` : '/images/placeholder.png';
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 text-left transition hover:border-emerald-500 hover:shadow"
    >
      <img src={img} alt={product.ten_san_pham} className="h-12 w-12 flex-shrink-0 rounded-md object-cover" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">{product.ten_san_pham}</p>
        <p className="text-sm font-semibold text-emerald-700">{formatCurrency(product.gia_ban)}</p>
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
          <div className="bg-emerald-700 px-4 py-3 font-medium text-white">Trợ lý mua sắm</div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            {messages.map((m, idx) => (
              <div key={m.matnc || idx} className={`max-w-[92%] ${m.vai_tro === 'user' ? 'self-end' : 'self-start'}`}>
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    m.vai_tro === 'user' ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-800'
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
            {loading && <div className="text-xs text-gray-400">Đang tìm sản phẩm...</div>}
            <div ref={bottomRef} />
          </div>

          <div className="flex border-t border-gray-200">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi... vd: tìm xoài"
              className="flex-1 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400"
            />
            <button
              onClick={sendMessage}
              className="bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              Gửi
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Đóng hộp trò chuyện' : 'Mở hộp trò chuyện'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-2xl text-white shadow-lg transition hover:bg-emerald-800"
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}