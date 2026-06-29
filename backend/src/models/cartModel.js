const db = require('../config/db');

// Giỏ hàng gồm 2 bảng:
//   gio_hang (magh, mand, ngay_tao) — 1 user = 1 giỏ
//   chi_tiet_gio_hang (mactgh, magh, masp, so_luong) — các sản phẩm trong giỏ

// Hàm nội bộ: tìm hoặc tạo giỏ cho user
async function getOrCreateCart(mand) {
    const [[cart]] = await db.query(
        'SELECT magh FROM gio_hang WHERE mand = ? LIMIT 1', [mand]
    );
    if (cart) return cart.magh;
    const [result] = await db.query(
        'INSERT INTO gio_hang (mand, ngay_tao) VALUES (?, NOW())', [mand]
    );
    return result.insertId;
}

// GET /api/cart
async function getCart(mand) {
    const magh = await getOrCreateCart(mand);

    const [items] = await db.query(
        `SELECT
       ctgh.masp       AS product_id,
       ctgh.so_luong   AS quantity,
       sp.ten_san_pham AS name,
       sp.gia_ban      AS price,
       sp.don_vi       AS unit,
       sp.so_luong_ton AS stock,
       sp.madm         AS category_id,
       hav.duong_dan   AS hinh_chinh
     FROM chi_tiet_gio_hang ctgh
     JOIN san_pham sp ON sp.masp = ctgh.masp
     LEFT JOIN hinh_anh_video hav
       ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
     WHERE ctgh.magh = ? AND sp.trang_thai = 1
     ORDER BY ctgh.mactgh DESC`,
        [magh]
    );

    const totalPrice = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);

    const discounts = [];
    if (totalQty >= 10) {
        discounts.push({ code: 'BULK_QUANTITY', label: 'Mua từ 10 sản phẩm', amount: Math.round(totalPrice * 0.05) });
    }

    const discountAmount = discounts.reduce((s, d) => s + d.amount, 0);
    const shipping = (totalPrice - discountAmount) >= 500000 ? 0 : 30000;
    const total = totalPrice - discountAmount + shipping;

    return {
        items: items.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            product: {
                name: i.name,
                price: Number(i.price),
                unit: i.unit,
                stock: i.stock,
                category_id: i.category_id,
                images: i.hinh_chinh ? [i.hinh_chinh] : [],
            },
        })),
        summary: { totalPrice, discountAmount, discounts, shipping, total },
    };
}

// POST /api/cart
async function addToCart(mand, masp, quantity = 1) {
    const [[sp]] = await db.query(
        'SELECT so_luong_ton, trang_thai FROM san_pham WHERE masp = ?', [masp]
    );
    if (!sp || !sp.trang_thai) throw new Error('Sản phẩm không tồn tại hoặc đã ngừng bán');
    if (sp.so_luong_ton < quantity) throw new Error(`Chỉ còn ${sp.so_luong_ton} sản phẩm trong kho`);

    const magh = await getOrCreateCart(mand);

    const [[existing]] = await db.query(
        'SELECT mactgh, so_luong FROM chi_tiet_gio_hang WHERE magh = ? AND masp = ?',
        [magh, masp]
    );

    if (existing) {
        const newQty = existing.so_luong + quantity;
        if (newQty > sp.so_luong_ton) throw new Error(`Chỉ còn ${sp.so_luong_ton} trong kho`);
        await db.query(
            'UPDATE chi_tiet_gio_hang SET so_luong = ? WHERE mactgh = ?',
            [newQty, existing.mactgh]
        );
    } else {
        await db.query(
            'INSERT INTO chi_tiet_gio_hang (magh, masp, so_luong) VALUES (?, ?, ?)',
            [magh, masp, quantity]
        );
    }
}

// PUT /api/cart/:masp
async function updateCartItem(mand, masp, quantity) {
    if (quantity <= 0) return removeFromCart(mand, masp);
    const [[sp]] = await db.query('SELECT so_luong_ton FROM san_pham WHERE masp = ?', [masp]);
    if (sp && quantity > sp.so_luong_ton) throw new Error(`Chỉ còn ${sp.so_luong_ton} trong kho`);
    const magh = await getOrCreateCart(mand);
    await db.query(
        'UPDATE chi_tiet_gio_hang SET so_luong = ? WHERE magh = ? AND masp = ?',
        [quantity, magh, masp]
    );
}

// DELETE /api/cart/:masp
async function removeFromCart(mand, masp) {
    const magh = await getOrCreateCart(mand);
    await db.query('DELETE FROM chi_tiet_gio_hang WHERE magh = ? AND masp = ?', [magh, masp]);
}

// DELETE /api/cart
async function clearCart(mand) {
    const magh = await getOrCreateCart(mand);
    await db.query('DELETE FROM chi_tiet_gio_hang WHERE magh = ?', [magh]);
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };