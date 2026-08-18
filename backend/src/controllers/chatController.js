const chatModel = require('../models/chatModel');
const productModel = require('../models/productModel');
const promotionModel = require('../models/promotionModel');

function removeDiacritics(str = '') {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
}

const replyCache = new Map();
const CACHE_MAX = 200;
const CACHE_TTL = 10 * 60 * 1000;

const GEMINI_API_KEYS = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean);
let currentKeyIndex = 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function cacheGet(key) {
    const entry = replyCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) { replyCache.delete(key); return null; }
    return entry.value;
}

function cacheSet(key, value) {
    if (replyCache.size >= CACHE_MAX) {
        replyCache.delete(replyCache.keys().next().value);
    }
    replyCache.set(key, { value, ts: Date.now() });
}

const STOPWORDS = [
    'tôi', 'muốn', 'tìm', 'mùa', 'có', 'không', 'gì', 'sản', 'phẩm', 'cho', 'xem', 'ơi',
    'nhé', 'là', 'loại', 'giúp', 'với', 'shop', 'của', 'hàng', 'vậy', 'nào', 'giá', 'bao', 'nhiêu',
    'ship', 'giao', 'nay', 'hiện', 'đang', 'em', 'anh', 'chị', 'cái', 'về', 'và', 'hay', 'hoặc',
    'trái', 'quả', 'cây', 'ạ', 'nha', 'nhỉ', 'đó', 'này', 'tháng', 'sắp', 'tới', 'kế', 'tiếp',
];

const STOPWORDS_NORMALIZED = new Set(STOPWORDS.map(removeDiacritics));

function extractKeywords(text) {
    return text
        .toLowerCase()
        .normalize('NFC')
        .replace(/[?!.,]/g, '')
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !STOPWORDS_NORMALIZED.has(removeDiacritics(w)));
}

function mapIntentToKeywords(userText) {
    const norm = removeDiacritics(userText.toLowerCase());
    const extraKeywords = [];

    if (/nong|oi|giai nhiet|giai khat|nang/.test(norm)) {
        extraKeywords.push('giai nhiet', 'giai khat', 'mat', 'thanh nhiet', 'nong');
    }
    if (/lanh|ret|am|buoi toi/.test(norm)) {
        extraKeywords.push('am', 'bo duong', 'tang de khang');
    }

    return extraKeywords;
}

const MONTH_WORD_MAP = {
    'thang mot': 1, 'thang 1': 1, 'thang hai': 2, 'thang ba': 3, 'thang tu': 4,
    'thang nam': 5, 'thang sau': 6, 'thang bay': 7, 'thang tam': 8, 'thang chin': 9,
    'thang muoi mot': 11, 'thang muoi hai': 12, 'thang muoi': 10,
};

// Phân tích ý định hỏi theo tháng/mùa:
function parseSeasonQuery(userText) {
    const norm = removeDiacritics(userText.toLowerCase());
    const currentMonth = new Date().getMonth() + 1;
    const isFutureQuery = /sap toi|tuong lai|mua moi|sap co|du bao|du kien|sap vao mua|mua ke tiep|mua sau/i.test(norm)
        || (/thang sau\b/i.test(norm) && !/thang nay/i.test(norm));

    let targetMonth = null;

    // Ưu tiên dạng số: "tháng 8", "t8"
    const numMatch = norm.match(/(?:thang|t)\s*([1-9]|1[0-2])\b/);
    if (numMatch) {
        targetMonth = parseInt(numMatch[1], 10);
    } else {
        // Dạng chữ: "tháng tám", "tháng mười hai"...
        for (const [key, val] of Object.entries(MONTH_WORD_MAP)) {
            if (norm.includes(key)) { targetMonth = val; break; }
        }
    }

    if (targetMonth == null) {
        if (/thang nay|hien tai|dang vao|dang ban|vao mua|dang la mua|dang mua gi/i.test(norm)
            || /an qua gi ngon nhat/i.test(norm)) {
            targetMonth = currentMonth;
        }
    }

    return { targetMonth, isFutureQuery };
}

function isPromotionQuestion(userText) {
    const norm = removeDiacritics(userText.toLowerCase());
    return /khuyen mai|giam gia|uu dai|voucher|coupon|ma giam|freeship|mien phi ship|sale|co giam|discount|promo|su kien|chuong trinh|dang co gi|co gi hot|co gi moi|uu dai gi|khuyen mai gi|giam gi/.test(norm);
}

function findMatchedSeasonIds(userText, seasons) {
    const textNormalized = removeDiacritics(userText.trim());
    const padded = ` ${textNormalized} `;
    const matchedIds = new Set();

    for (const s of seasons) {
        const fullName = (s.ten_mua || '').toLowerCase().trim();
        if (!fullName) continue;

        const fullNameNormalized = removeDiacritics(fullName);
        const shortName = fullName.replace(/^mua\s+|^mùa\s+/i, '').trim();
        const shortNameNormalized = removeDiacritics(shortName);

        if (padded.includes(` ${fullNameNormalized} `)) {
            matchedIds.add(s.mamv);
            continue;
        }
        if (
            shortNameNormalized.length >= 2 &&
            shortNameNormalized !== 'mua' &&
            padded.includes(` ${shortNameNormalized} `)
        ) {
            matchedIds.add(s.mamv);
        }
    }

    if (/\bhe\b/.test(textNormalized)) {
        const haSeason = seasons.find((s) =>
            removeDiacritics((s.ten_mua || '').toLowerCase()).includes('ha')
        );
        if (haSeason) matchedIds.add(haSeason.mamv);
    }

    return Array.from(matchedIds);
}

function buildFallback(userMessage, products) {
    const text = userMessage.toLowerCase();

    if (products.length === 0) {
        return {
            reply: 'Xin lỗi, mình chưa tìm thấy sản phẩm phù hợp. Bạn thử từ khoá khác nhé! 😊',
            product_ids: [],
            disabled_ids: [],
        };
    }

    if (/mùa|theo mùa|đang mùa|sắp tới|tương lai|dự báo|trái mùa/i.test(text)) {
        const product_ids = products.slice(0, 4).map((p) => p.masp);
        return {
            reply: `Mình tìm thấy ${products.length} sản phẩm thuộc mùa vụ mà bạn quan tâm 🌱`,
            product_ids,
            disabled_ids: products.filter(p => product_ids.includes(p.masp) && p.trang_thai_mua_vu === 'sap_toi').map(p => p.masp),
        };
    }

    if (/giá|bao nhiêu|rẻ|đắt/i.test(text)) {
        const sellingNow = products.filter(p => p.trang_thai_mua_vu !== 'sap_toi');
        const pool = sellingNow.length ? sellingNow : products;
        const cheapest = [...pool].sort((a, b) => Number(a.gia_ban) - Number(b.gia_ban))[0];
        return {
            reply: `Sản phẩm giá tốt nhất là ${cheapest.ten_san_pham} — ${Number(cheapest.gia_ban).toLocaleString('vi-VN')}đ/${cheapest.don_vi} thôi! 🎉`,
            product_ids: sellingNow.slice(0, 4).map((p) => p.masp),
            disabled_ids: [],
        };
    }

    const sellingNow = products.filter(p => p.trang_thai_mua_vu !== 'sap_toi');
    return {
        reply: `Mình tìm thấy ${products.length} sản phẩm có thể bạn quan tâm:`,
        product_ids: sellingNow.slice(0, 4).map((p) => p.masp),
        disabled_ids: [],
    };
}

function extractJson(text) {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    if (start === -1) throw new Error('Không tìm thấy JSON trong phản hồi.');

    let depth = 0;
    let end = -1;
    let inString = false;
    let escape = false;
    for (let i = start; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }

    const jsonStr = end !== -1
        ? cleaned.slice(start, end + 1)
        : repairTruncatedJson(cleaned.slice(start));

    return JSON.parse(jsonStr);
}

function repairTruncatedJson(partial) {
    let result = partial;

    const quoteCount = (result.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) result += '"';

    result = result.replace(/,\s*$/, '');

    const missingBrackets = (result.match(/\[/g) || []).length - (result.match(/\]/g) || []).length;
    const missingBraces = (result.match(/\{/g) || []).length - (result.match(/\}/g) || []).length;
    result += ']'.repeat(Math.max(0, missingBrackets));
    result += '}'.repeat(Math.max(0, missingBraces));

    return result;
}

async function callGemini(apiKey, systemPrompt, fullPrompt) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    temperature: 0,
                    maxOutputTokens: 1024,
                    responseMimeType: 'application/json',
                    thinkingConfig: {
                        thinkingBudget: 0,
                    },
                },
            }),
        }
    );
    const data = await res.json();
    return { res, data };
}

async function askAI(userMessage, products, promotions = []) {
    if (!GEMINI_API_KEYS.length) return buildFallback(userMessage, products);

    const promoKey = promotions.map(p => p.makm).sort().join(',');
    const cacheKey = `${userMessage.trim().toLowerCase()}::${products.map((p) => `${p.masp}:${p.trang_thai_mua_vu || ''}`).sort().join(',')}::promo:${promoKey}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
        console.log('[askAI] cache hit');
        return cached;
    }

    let promoSection = '';
    if (promotions.length > 0) {
        const formatDate = (d) => {
            if (!d) return null;
            const dt = new Date(d);
            return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
        };

        const promoData = promotions.map(p => {
            const item = {
                ten: p.ten_km,
                trang_thai: p.trang_thai_km === 'sap_toi' ? 'Sắp diễn ra' : 'Đang diễn ra',
            };
            if (p.ma_code) item.ma_code = p.ma_code;
            if (p.phan_tram_giam) item.giam = Number(p.phan_tram_giam) + '%';
            if (p.loai_uu_dai === 'mien_phi_ship') {
                item.loai = 'Freeship';
                item.dieu_kien = 'Đơn từ ' + Number(p.dieu_kien_toi_thieu).toLocaleString('vi-VN') + 'đ';
            } else {
                item.loai = 'Giảm giá';
                item.dieu_kien = 'Từ ' + Number(p.dieu_kien_toi_thieu) + ' sản phẩm';
            }
            item.ap_dung = p.ap_dung_cho === 'tat_ca' ? 'Tất cả đơn hàng'
                : p.ap_dung_cho === 'thuong_va_dat_truoc' ? 'Đơn thường & Đặt trước'
                : p.ap_dung_cho === 'dinh_ky' ? 'Đăng ký giao định kỳ' : p.ap_dung_cho;
            const bd = formatDate(p.ngay_bat_dau);
            const kt = formatDate(p.ngay_ket_thuc);
            if (bd && kt) item.thoi_gian = bd + ' - ' + kt;
            else if (bd) item.thoi_gian = 'Từ ' + bd;
            else if (kt) item.thoi_gian = 'Đến ' + kt;
            else item.thoi_gian = 'Không giới hạn';
            return item;
        });

        promoSection = `
KHUYẾN MÃI & SỰ KIỆN (gợi ý khi khách hỏi về khuyến mãi/giảm giá/ưu đãi/sự kiện):
QUY TẮC BẮT BUỘC KHI TRẢ LỜI VỀ KHUYẾN MÃI:
1. Liệt kê TẤT CẢ chương trình trong DANH_SACH_KHUYEN_MAI bên dưới.
2. Mỗi chương trình PHẢI ghi rõ: tên chương trình, mức giảm, điều kiện, thời gian hiệu lực.
3. Nếu có "ma_code" thì BẮT BUỘC ghi rõ: "Nhập mã: [MA_CODE]" để khách dùng.
4. Phân biệt rõ chương trình "Đang diễn ra" và "Sắp diễn ra".
5. KHÔNG tự bịa khuyến mãi ngoài danh sách.
DANH_SACH_KHUYEN_MAI:
${JSON.stringify(promoData)}`;
    }

    const systemPrompt = `Bạn là trợ lý bán hàng thông minh của sàn "Chợ Nông Sản".
Nhiệm vụ: Tư vấn sản phẩm và hướng dẫn khách hàng thân thiện, tự nhiên.

QUY TẮC ĐỊNH DẠNG BẮT BUỘC:
1. Mỗi sản phẩm NẰM TRÊN 1 DÒNG RIÊNG.
2. Cấu trúc mỗi sản phẩm: [STT]. [Tên sản phẩm]: [Miêu tả công dụng/vị ngon ngắn gọn trong 1-2 câu lấy từ mo_ta].
3. Dùng 1-2 dấu xuống dòng (\n\n) giữa các phần.
4. KHÔNG dùng cú pháp Markdown như **, *, #, _.
5. CHỈ DÙNG SẢN PHẨM CÓ TRONG DANH_SACH, không tự bịa sản phẩm ngoài danh sách.
6. LỜI CHÚC VÀ HƯỚNG DẪN Ở CUỐI: Kèm câu hướng dẫn đặt hàng và lời chúc ở cuối.

QUY TẮC BẮT BUỘC VỀ TRẠNG THÁI MÙA VỤ — MỖI SẢN PHẨM TRONG DANH_SACH CÓ TRƯỜNG "trang_thai_mua_vu":
- "dang_ban": sản phẩm đang bán thật, khách có thể mua ngay. Trình bày bình thường, dùng giá trong trường "gia". Nếu có trường "ten_mua", có thể nhắc tên mùa (VD "đang vào Mùa Hè"). Nếu nhiều sản phẩm có "ten_mua" KHÁC NHAU cùng trong danh sách, hãy nhắc rõ TỪNG tên mùa tương ứng với từng sản phẩm, không gộp chung thành 1 mùa.
- "sap_toi": sản phẩm THUỘC MÙA VỤ SẮP TỚI, CHƯA BÁN VỤ MỚI, chỉ mang tính DỰ BÁO/THAM KHẢO. Bắt buộc phải:
  + Ghi rõ nhãn "(Sắp vào mùa - Dự kiến)" ngay sau tên sản phẩm.
  + Không mời khách "mua ngay" cho đợt mùa vụ sắp tới — chỉ nói giá dự kiến, thời điểm dự kiến có hàng (dựa vào "ten_mua" nếu có).
  + Nếu trường "co_san_hien_tai" là true: Hãy nhắc thêm ngắn gọn cho khách biết: "(Hiện tại sản phẩm này cũng đang có sẵn hàng với giá [gia_hien_tai]đ/[don_vi], bạn có thể mua ngay nếu cần nhé!)".
  + VẪN ĐƯỢC đưa masp của sản phẩm "sap_toi" vào mảng "product_ids" — hệ thống sẽ tự hiển thị dạng xem trước, không cho đặt hàng ngay.
- "thuong": sản phẩm bán bình thường, không gắn với mùa vụ cụ thể — trình bày như "dang_ban".

XỬ LÝ YÊU CẦU:
- Nếu hỏi HƯỚNG DẪN: Trả lời ngắn gọn theo HƯỚNG DẪN QUY TRÌNH HỆ THỐNG và trả về "product_ids": [].
- Nếu TÌM SẢN PHẨM: Chọn các sản phẩm phù hợp nhất trong DANH_SACH, tuân thủ đúng quy tắc trạng thái mùa vụ ở trên.
- Nếu hỏi về KHUYẾN MÃI/GIẢM GIÁ/ƯU ĐÃI/SỰ KIỆN: Liệt kê TẤT CẢ chương trình trong DANH_SACH_KHUYEN_MAI, ghi rõ mã code (nếu có), thời gian, điều kiện. Trả về "product_ids": [].

HƯỚNG DẪN QUY TRÌNH HỆ THỐNG:
1. Cách đặt hàng: Chọn sản phẩm -> Thêm vào giỏ -> Bấm Thanh toán -> Điền địa chỉ và Đặt hàng.
2. Cách thanh toán: Hỗ trợ VietQR và COD (hoặc đặt cọc 30% cho đơn định kỳ).
3. Cách tìm kiếm: Dùng thanh tìm kiếm hoặc gõ nhu cầu vào khung chat.
${promoSection}

Định dạng trả về duy nhất JSON:
{"reply": "Nội dung phản hồi", "product_ids": [danh sách masp số nguyên, tối đa 4]}`;

    const danhSachGoc = products.map((p) => ({
        masp: p.masp,
        ten: p.ten_san_pham,
        mo_ta: p.mo_ta || '',
        // 'sap_toi' -> giá dự kiến; các trạng thái khác -> LUÔN giá bán thực tế, mặc kệ giá dự kiến
        gia: p.trang_thai_mua_vu === 'sap_toi' && p.gia_du_kien != null ? Number(p.gia_du_kien) : Number(p.gia_ban),
        don_vi: p.don_vi,
        trang_thai_mua_vu: p.trang_thai_mua_vu || 'thuong',
        ten_mua: p.ten_mua || null,
        co_san_hien_tai: Number(p.so_luong_ton || 0) > 0,
        gia_hien_tai: Number(p.gia_ban || 0),
    }));

    const fullPrompt = `DANH_SACH:\n${JSON.stringify(danhSachGoc)}\n\nCâu hỏi khách hàng: "${userMessage}"`;

    for (let keyOffset = 0; keyOffset < GEMINI_API_KEYS.length; keyOffset++) {
        const keyPos = (currentKeyIndex + keyOffset) % GEMINI_API_KEYS.length;
        const apiKey = GEMINI_API_KEYS[keyPos];
        const isLastKey = keyOffset === GEMINI_API_KEYS.length - 1;

        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const { res, data } = await callGemini(apiKey, systemPrompt, fullPrompt);
                console.log(`[askAI] key #${keyPos + 1}/${GEMINI_API_KEYS.length} - status:`, res.status, `(lần ${attempt})`);

                if (res.status === 429) {
                    console.warn(`[askAI] key #${keyPos + 1} hết quota.`);
                    if (isLastKey) {
                        return buildFallback(userMessage, products);
                    }
                    break;
                }

                if (res.status === 503 && attempt === 1) {
                    await sleep(1200);
                    continue;
                }

                if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);

                const parts = data?.candidates?.[0]?.content?.parts || [];
                const text = parts.map(p => p.text || '').join('\n');

                const parsed = extractJson(text);
                const validIds = new Set(products.map((p) => p.masp));
                const sapToiIds = new Set(products.filter(p => p.trang_thai_mua_vu === 'sap_toi').map(p => p.masp));

                // Giữ lại cả sản phẩm sap_toi trong product_ids (để hiện card xem trước),
                // nhưng tách riêng disabled_ids để frontend biết cái nào KHOÁ click / không cho đặt hàng.
                const product_ids = (parsed.product_ids || []).filter((id) => validIds.has(id));
                const disabled_ids = product_ids.filter((id) => sapToiIds.has(id));

                const result = {
                    reply: parsed.reply || 'Mình đã tìm thấy vài gợi ý cho bạn.',
                    product_ids,
                    disabled_ids,
                };

                cacheSet(cacheKey, result);
                currentKeyIndex = keyPos;
                return result;
            } catch (err) {
                console.error(`[askAI] key #${keyPos + 1} lỗi (lần ${attempt}):`, err.message);
                if (attempt === 2 && isLastKey) return buildFallback(userMessage, products);
                if (attempt === 2) break;
            }
        }
    }

    return buildFallback(userMessage, products);
}

// --- USER APIS ---

exports.getMyMessages = async (req, res) => {
    try {
        const mand = req.user.id;
        const mapc = await chatModel.getOrCreateSession(mand);
        const messages = await chatModel.getMessages(mapc);
        res.json({ sessionId: mapc, messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.sendMyMessage = async (req, res) => {
    try {
        const mand = req.user.id;
        const { noi_dung } = req.body;

        if (!noi_dung?.trim()) {
            return res.status(400).json({ message: 'Tin nhắn không được để trống.' });
        }

        const mapc = await chatModel.getOrCreateSession(mand);
        await chatModel.sendMessage({ mapc, vai_tro: 'user', noi_dung });

        const seasons = await productModel.getActiveSeasons();
        const seasonIds = findMatchedSeasonIds(noi_dung, seasons);
        const { targetMonth, isFutureQuery } = parseSeasonQuery(noi_dung);

        // tránh các từ chung chung (đã lỡ lọt qua stopword) khớp nhầm sản phẩm không liên quan.
        const hasExplicitSeasonIntent = targetMonth !== null || isFutureQuery || seasonIds.length > 0;

        const userKeywords = extractKeywords(noi_dung);
        const intentKeywords = mapIntentToKeywords(noi_dung);
        const keywords = hasExplicitSeasonIntent
            ? []
            : Array.from(new Set([...userKeywords, ...intentKeywords])).slice(0, 8);

        const contextProducts = await productModel.findProductsForChat(
            { keywords, seasonIds, targetMonth, isFutureQuery },
            10
        );

        console.log('[sendMyMessage] noi_dung:', noi_dung);
        console.log('[sendMyMessage] hasExplicitSeasonIntent:', hasExplicitSeasonIntent, 'keywords:', keywords);
        console.log('[sendMyMessage] seasonIds:', seasonIds, 'targetMonth:', targetMonth, 'isFutureQuery:', isFutureQuery);
        console.log('[sendMyMessage] contextProducts:', contextProducts.map(p => `${p.masp}:${p.ten_san_pham}:${p.trang_thai_mua_vu}`));

        let finalProducts = contextProducts;
        if (finalProducts.length === 0 && keywords.length === 0 && seasonIds.length === 0 && targetMonth === null) {
            finalProducts = await productModel.searchProductsForChat('', 8);
        }

        let activePromotions = [];
        if (isPromotionQuestion(noi_dung)) {
            activePromotions = await promotionModel.getActivePromotionsForChat();
            console.log('[sendMyMessage] Khách hỏi khuyến mãi, tìm thấy:', activePromotions.length, 'chương trình đang hoạt động');
        }

        const { reply, product_ids, disabled_ids } = await askAI(noi_dung, finalProducts, activePromotions);

        let loai_gui_y = null;
        if (activePromotions.length > 0 && isPromotionQuestion(noi_dung)) {
            loai_gui_y = 'khuyen_mai';
        } else if (product_ids.length) {
            loai_gui_y = 'san_pham';
        }

        await chatModel.sendMessage({
            mapc,
            vai_tro: 'bot',
            noi_dung: reply,
            loai_gui_y,
            product_ids,
            disabled_ids,
            product_cards: product_ids.map(masp => {
                const product = finalProducts.find(item => item.masp === masp);
                return {
                    masp,
                    trang_thai: disabled_ids.includes(masp) ? 'sap_toi' : 'dang_ban',
                    gia_du_kien: disabled_ids.includes(masp) ? Number(product?.gia_du_kien) : null,
                    ten_mua: product?.ten_mua || null,
                };
            }),
            isSeason: seasonIds.length > 0 || targetMonth !== null,
        });

        res.status(201).json({ message: 'Đã gửi' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// --- ADMIN APIS ---

exports.getSessions = async (req, res) => {
    try {
        const sessions = await chatModel.getSessions();
        res.json({ sessions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getSessionMessages = async (req, res) => {
    try {
        const messages = await chatModel.getSessionMessages(req.params.id);
        res.json({ sessionId: req.params.id, messages });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.adminSendMessage = async (req, res) => {
    try {
        const { noi_dung } = req.body;
        if (!noi_dung?.trim()) {
            return res.status(400).json({ message: 'Tin nhắn không được để trống.' });
        }
        await chatModel.sendMessage({
            mapc: req.params.id,
            vai_tro: 'admin',
            noi_dung,
            loai_gui_y: null,
            product_ids: [],
            disabled_ids: [],
        });
        res.status(201).json({ message: 'Đã gửi' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.closeSession = async (req, res) => {
    try {
        await chatModel.closeSession(req.params.id);
        res.json({ message: 'Đã đóng phiên chat.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
