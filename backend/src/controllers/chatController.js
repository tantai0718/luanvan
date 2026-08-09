const chatModel = require('../models/chatModel');
const productModel = require('../models/productModel');

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
    'trái', 'quả', 'ạ', 'nha', 'nhỉ', 'đó', 'này',
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
        };
    }

    if (/mùa|theo mùa|đang mùa/i.test(text)) {
        return {
            reply: `Mình tìm thấy ${products.length} sản phẩm thuộc mùa vụ mà bạn quan tâm 🌱`,
            product_ids: products.slice(0, 4).map((p) => p.masp),
        };
    }

    if (/giá|bao nhiêu|rẻ|đắt/i.test(text)) {
        const cheapest = [...products].sort((a, b) => Number(a.gia_ban) - Number(b.gia_ban))[0];
        return {
            reply: `Sản phẩm giá tốt nhất là ${cheapest.ten_san_pham} — ${Number(cheapest.gia_ban).toLocaleString('vi-VN')}đ/${cheapest.don_vi} thôi! 🎉`,
            product_ids: products.slice(0, 4).map((p) => p.masp),
        };
    }

    return {
        reply: `Mình tìm thấy ${products.length} sản phẩm có thể bạn quan tâm:`,
        product_ids: products.slice(0, 4).map((p) => p.masp),
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

async function askAI(userMessage, products) {
    if (!GEMINI_API_KEYS.length) return buildFallback(userMessage, products);

    const cacheKey = `${userMessage.trim().toLowerCase()}::${products.map((p) => p.masp).sort().join(',')}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
        console.log('[askAI] cache hit');
        return cached;
    }

    const systemPrompt = `Bạn là trợ lý bán hàng thông minh của sàn "Chợ Nông Sản".
Nhiệm vụ: Tư vấn sản phẩm và hướng dẫn khách hàng thân thiện, tự nhiên.

QUY TẮC ĐỊNH DẠNG BẮT BUỘC:
1. Mỗi sản phẩm NẰM TRÊN 1 DÒNG RIÊNG.
2. Cấu trúc mỗi sản phẩm: [STT]. [Tên sản phẩm]: [Miêu tả công dụng/vị ngon ngắn gọn trong 1-2 câu lấy từ mo_ta].
3. Dùng 1-2 dấu xuống dòng (\\n\\n) giữa các phần.
4. KHÔNG dùng cú pháp Markdown như **, *, #, _.
5. CHỈ DÙNG SẢN PHẨM CÓ TRONG DANH_SACH, không tự bịa sản phẩm ngoài danh sách.
6. LỜI CHÚC VÀ HƯỚNG DẪN Ở CUỐI: Kèm câu hướng dẫn đặt hàng và lời chúc ở cuối.

HƯỚNG DẪN QUY TRÌNH HỆ THỐNG:
1. Cách đặt hàng: Chọn sản phẩm -> Thêm vào giỏ -> Bấm Thanh toán -> Điền địa chỉ và Đặt hàng.
2. Cách thanh toán: Hỗ trợ VietQR và COD (hoặc đặt cọc 30% cho đơn định kỳ).
3. Cách tìm kiếm: Dùng thanh tìm kiếm hoặc gõ nhu cầu vào khung chat.

XỬ LÝ YÊU CẦU:
- Nếu hỏi HƯỚNG DẪN: Trả lời ngắn gọn theo HƯỚNG DẪN QUY TRÌNH HỆ THỐNG và trả về "product_ids": [].
- Nếu TÌM SẢN PHẨM: Chọn các sản phẩm phù hợp nhất trong DANH_SACH.

Định dạng trả về duy nhất JSON:
{"reply": "Nội dung phản hồi", "product_ids": [danh sách masp số nguyên, tối đa 4]}`;

    const danhSachGoc = products.map((p) => ({
        masp: p.masp,
        ten: p.ten_san_pham,
        mo_ta: p.mo_ta || '',
        gia: p.gia_du_kien != null ? Number(p.gia_du_kien) : Number(p.gia_ban),
        don_vi: p.don_vi,
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
                const product_ids = (parsed.product_ids || []).filter((id) => validIds.has(id));

                const result = {
                    reply: parsed.reply || 'Mình đã tìm thấy vài gợi ý cho bạn.',
                    product_ids,
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

        const userKeywords = extractKeywords(noi_dung);
        const intentKeywords = mapIntentToKeywords(noi_dung);
        const keywords = Array.from(new Set([...userKeywords, ...intentKeywords])).slice(0, 8);

        const seasons = await productModel.getActiveSeasons();
        const seasonIds = findMatchedSeasonIds(noi_dung, seasons);

        // ĐÃ BỎ LỌC THEO THÁNG: Chỉ truyền seasonIds trực tiếp nếu tìm thấy từ tên Mùa
        const contextProducts = await productModel.findProductsForChat(
            { keywords, seasonIds },
            10
        );

        console.log('[sendMyMessage] noi_dung:', noi_dung);
        console.log('[sendMyMessage] keywords:', keywords);
        console.log('[sendMyMessage] seasonIds:', seasonIds);
        console.log('[sendMyMessage] contextProducts:', contextProducts.map(p => `${p.masp}:${p.ten_san_pham}`));

        let finalProducts = contextProducts;
        if (finalProducts.length === 0 && keywords.length === 0 && seasonIds.length === 0) {
            finalProducts = await productModel.searchProductsForChat('', 8);
        }

        const { reply, product_ids } = await askAI(noi_dung, finalProducts);

        await chatModel.sendMessage({
            mapc,
            vai_tro: 'bot',
            noi_dung: reply,
            loai_gui_y: product_ids.length ? 'san_pham' : null,
            product_ids,
            isSeason: seasonIds.length > 0, 
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