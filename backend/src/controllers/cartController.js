const cartModel = require('../models/cartModel');

// CartContext gọi cartAPI.get() và expect { cart: [...], summary: {...} }
async function getCart(req, res) {
    try {
        const data = await cartModel.getCart(req.user.id);
        res.json({ cart: data.items, summary: data.summary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// CartContext gửi { product_id, quantity }
async function addToCart(req, res) {
    try {
        const masp = req.body.product_id || req.body.ma_san_pham;
        const so_luong = Number(req.body.quantity || req.body.so_luong || 1);
        if (!masp) return res.status(400).json({ message: 'Thiếu mã sản phẩm' });
        await cartModel.addToCart(req.user.id, masp, so_luong);
        res.json({ message: 'Đã thêm vào giỏ hàng' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updateCart(req, res) {
    try {
        const qty = Number(req.body.quantity ?? req.body.so_luong);
        await cartModel.updateCartItem(req.user.id, req.params.masp, qty);
        res.json({ message: 'Đã cập nhật giỏ hàng' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function removeFromCart(req, res) {
    try {
        await cartModel.removeFromCart(req.user.id, req.params.masp);
        res.json({ message: 'Đã xoá sản phẩm khỏi giỏ' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function clearCart(req, res) {
    try {
        await cartModel.clearCart(req.user.id);
        res.json({ message: 'Đã xoá giỏ hàng' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getCart, addToCart, updateCart, removeFromCart, clearCart };