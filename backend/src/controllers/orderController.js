const orderModel = require('../models/orderModel');
const userModel = require('../models/userModel');

// Cart.jsx gửi: { dia_chi_giao, ghi_chu, phuong_thuc_tt }
async function createOrder(req, res) {
    try {
        const { dia_chi_giao, phuong_thuc_tt, ma_code } = req.body;
        if (!dia_chi_giao?.trim()) return res.status(400).json({ message: 'Vui lòng nhập địa chỉ giao hàng.' });
        const nguoi_dung = await userModel.findById(req.user.id);
        const { madh, tong_tien } = await orderModel.createOrder({
            mand: req.user.id, dia_chi_giao,
            phuong_thuc: phuong_thuc_tt || 'tien_mat',
            ma_code: ma_code || '', nguoi_dung,
        });
        res.status(201).json({ message: 'Đặt hàng thành công', order: { id: madh, ma_don_hang: madh, tong_tien } });
    } catch (err) {
        console.error('[createOrder]', err);
        res.status(400).json({ message: err.message });
    }
}

async function getMyOrders(req, res) {
    try {
        const rows = await orderModel.getOrdersByUser(req.user.id);
        res.json({ orders: rows.map(orderModel.mapOrder) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getOrderById(req, res) {
    try {
        const raw = await orderModel.getOrderById(req.params.id, req.user.id);
        if (!raw) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        res.json({ order: { ...orderModel.mapOrder(raw), items: raw.items } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function cancelOrder(req, res) {
    try {
        await orderModel.cancelOrder(req.params.id, req.user.id);
        res.json({ message: 'Đã huỷ đơn hàng.' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function adminGetOrders(req, res) {
    try {
        const { page, limit, trang_thai } = req.query;
        const data = await orderModel.getAllOrders({ page, limit, trang_thai });
        res.json({ ...data, orders: data.orders.map(orderModel.mapOrder) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function adminUpdateStatus(req, res) {
    try {
        await orderModel.updateOrderStatus(req.params.id, req.body.trang_thai);
        res.json({ message: 'Cập nhật trạng thái đơn hàng thành công.' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder, adminGetOrders, adminUpdateStatus };