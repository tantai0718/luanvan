const db = require('../config/db');
const crypto = require('crypto');

async function getOrCreateSession(mand) {
    const [rows] = await db.query(
        `SELECT mapc FROM phien_chat
         WHERE mand = ? AND trang_thai = 'dang_hoat_dong'
         ORDER BY ngay_bat_dau DESC
         LIMIT 1`,
        [mand]
    );

    if (rows.length) return rows[0].mapc;

    const token = crypto.randomBytes(16).toString('hex');

    const [result] = await db.query(
        `INSERT INTO phien_chat (mand, session_token, ngay_bat_dau, trang_thai)
         VALUES (?, ?, NOW(), 'dang_hoat_dong')`,
        [mand, token]
    );

    return result.insertId;
}

async function sendMessage({ mapc, vai_tro, noi_dung, loai_gui_y = null, product_ids = null, disabled_ids = [], product_cards = [], isSeason = false }) {
    const loai_phien_only = product_ids && product_ids.length
        ? JSON.stringify({
            suggested_ids: product_ids,
            disabled_ids,
            product_cards,
            is_season: isSeason,
        })
        : null;

    const [result] = await db.query(
        `INSERT INTO tin_nhan_chat (mapc, vai_tro, noi_dung, loai_phien_only, loai_gui_y, thoi_gian)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [mapc, vai_tro, noi_dung, loai_phien_only, loai_gui_y]
    );

    return result.insertId;
}

async function attachProducts(messages) {
    const idSet = new Set();
    for (const m of messages) {
        if (!m.loai_phien_only) continue;
        try {
            const parsed = typeof m.loai_phien_only === 'string'
                ? JSON.parse(m.loai_phien_only)
                : m.loai_phien_only;
            (parsed.suggested_ids || []).forEach(id => idSet.add(id));
        } catch { /* bỏ qua */ }
    }

    let productMap = {};
    if (idSet.size) {
        const ids = Array.from(idSet);

        const [rows] = await db.query(
            `SELECT sp.masp, sp.ten_san_pham, sp.gia_ban, sp.don_vi, sp.so_luong_ton,
                    sp.han_su_dung, sp.so_ngay_can_han, sp.phan_tram_giam_can_han,
                    hav.duong_dan AS hinh_chinh
             FROM san_pham sp
             LEFT JOIN hinh_anh_video hav
               ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
             WHERE sp.masp IN (?)`,
            [ids]
        );
        rows.forEach(r => {
            productMap[r.masp] = {
                masp: r.masp,
                ten_san_pham: r.ten_san_pham,
                gia_ban: Number(r.gia_ban || 0),
                don_vi: r.don_vi,
                ton_kho: Number(r.so_luong_ton || 0),
                han_su_dung: r.han_su_dung,
                so_ngay_can_han: Number(r.so_ngay_can_han || 0),
                phan_tram_giam_can_han: Number(r.phan_tram_giam_can_han || 0),
                hinh_anh: r.hinh_chinh ? `/upload/${r.hinh_chinh}` : null,
            };
        });
    }

    return messages.map(m => {
        let products = [];
        if (m.loai_phien_only) {
            try {
                const parsed = typeof m.loai_phien_only === 'string'
                    ? JSON.parse(m.loai_phien_only)
                    : m.loai_phien_only;

                const cardMap = new Map((parsed.product_cards || []).map(card => [Number(card.masp), card]));
                const disabledIds = new Set((parsed.disabled_ids || []).map(Number));

                products = (parsed.suggested_ids || [])
                    .map(id => {
                        const base = productMap[id];
                        if (!base) return null;
                        const card = cardMap.get(Number(id));
                        const isPreview = card?.trang_thai === 'sap_toi' || disabledIds.has(Number(id));
                        return {
                            ...base,
                            gia_du_kien: isPreview && card?.gia_du_kien != null ? Number(card.gia_du_kien) : null,
                            ten_mua: card?.ten_mua || null,
                            la_du_bao: isPreview,
                            co_the_mua: !isPreview && base.ton_kho > 0,
                        };
                    })
                    .filter(Boolean);
            } catch { /* bỏ qua */ }
        }
        return {
            matnc: m.matnc,
            mapc: m.mapc,
            vai_tro: m.vai_tro,
            noi_dung: m.noi_dung,
            thoi_gian: m.thoi_gian,
            products,
        };
    });
}

async function getMessages(mapc) {
    const [rows] = await db.query(
        `SELECT matnc, mapc, vai_tro, noi_dung, loai_phien_only, loai_gui_y, thoi_gian
         FROM tin_nhan_chat
         WHERE mapc = ?
         ORDER BY thoi_gian ASC`,
        [mapc]
    );
    return attachProducts(rows);
}

async function getSessions() {
    const [rows] = await db.query(
        `SELECT
            pc.mapc, pc.trang_thai, pc.ngay_bat_dau,
            nd.mand, nd.ho_ten, nd.email,
            (SELECT noi_dung FROM tin_nhan_chat WHERE mapc = pc.mapc ORDER BY thoi_gian DESC LIMIT 1) AS tin_cuoi,
            (SELECT thoi_gian FROM tin_nhan_chat WHERE mapc = pc.mapc ORDER BY thoi_gian DESC LIMIT 1) AS ngay_cuoi
         FROM phien_chat pc
         JOIN nguoi_dung nd ON nd.mand = pc.mand
         ORDER BY ngay_cuoi DESC, pc.ngay_bat_dau DESC`
    );
    return rows;
}

async function getSessionMessages(mapc) {
    return getMessages(mapc);
}

async function closeSession(mapc) {
    await db.query(
        `UPDATE phien_chat SET trang_thai = 'da_dong', ngay_ket_thuc = NOW() WHERE mapc = ?`,
        [mapc]
    );
}

module.exports = {
    getOrCreateSession,
    sendMessage,
    getMessages,
    getSessions,
    getSessionMessages,
    closeSession,
};
