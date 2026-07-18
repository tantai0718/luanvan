const db = require('../config/db');
const notificationModel = require('../models/notificationModel');
const { saveDataUrlImage } = require("../utils/imageHelpers");

// Hàm ánh xạ (map) để chuẩn hóa cấu trúc dữ liệu trả về (nếu bạn cần đổi tên trường giống bên Banner)
// Ở đây tôi giữ nguyên hoặc bạn có thể custom lại theo ý muốn
const mapNotification = (notif) => ({
    id: notif.matb,
    user_id: notif.mand,
    title: notif.tieu_de,
    content: notif.noi_dung,
    image: notif.hinh_anh,
    type: notif.loai,
    active: Boolean(notif.kich_hoat),
    is_read: Boolean(notif.da_doc),
    created_at: notif.ngay_tao,
});

// --- USER APIS ---

exports.getMyNotifications = async (req, res) => {
    try {
        const mand = req.user.id;
        const rows = await notificationModel.getByUser(mand);
        const chua_doc = await notificationModel.countUnread(mand);
        res.json({ notifications: rows, chua_doc });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await notificationModel.markAsRead(req.params.id, req.user.id);
        res.json({ message: 'Đã đánh dấu đã đọc' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await notificationModel.markAllAsRead(req.user.id);
        res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getGlobalNotifications = async (req, res) => {
    try {
        const notifications = await notificationModel.getActiveGlobalNotifications();
        res.json({ notifications });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- ADMIN APIS ---

exports.adminGetAllGlobal = async (req, res) => {
    try {
        const notifications = await notificationModel.adminGetAllGlobal();
        res.json({ notifications });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.adminCreate = async (req, res) => {
    try {
        const { tieu_de, noi_dung, loai, hinh_anh } = req.body;
        if (!tieu_de?.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tiêu đề.' });
        }
        
        const loaiHopLe = ['he_thong', 'khuyen_mai'].includes(loai) ? loai : 'khuyen_mai';
        
        // Sử dụng helper dùng chung, lưu vào thư mục 'notifications' với tiền tố tên file là 'notif'
        const storedImage = await saveDataUrlImage(hinh_anh, "notifications", "notif");

        await notificationModel.createGlobalNotification({
            tieu_de, 
            noi_dung: noi_dung || '', 
            loai: loaiHopLe, 
            hinh_anh: storedImage, // Đường dẫn ảnh đã chuẩn hóa từ helper
        });
        res.status(201).json({ message: 'Đã tạo thông báo.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.adminUpdate = async (req, res) => {
    try {
        const { tieu_de, noi_dung, loai, hinh_anh } = req.body;
        const loaiHopLe = ['he_thong', 'khuyen_mai'].includes(loai) ? loai : 'khuyen_mai';
        
        // Sử dụng helper dùng chung tương tự như hàm tạo mới
        const storedImage = await saveDataUrlImage(hinh_anh, "notifications", "notif");

        await notificationModel.updateGlobalNotification(req.params.id, {
            tieu_de, 
            noi_dung: noi_dung || '', 
            loai: loaiHopLe, 
            hinh_anh: storedImage,
        });
        res.json({ message: 'Đã cập nhật.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.adminToggle = async (req, res) => {
    try {
        await notificationModel.toggleGlobalNotification(req.params.id);
        res.json({ message: 'Đã cập nhật trạng thái.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.adminDelete = async (req, res) => {
    try {
        await notificationModel.deleteGlobalNotification(req.params.id);
        res.json({ message: 'Đã xoá.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.adminGetOrderHistory = async (req, res) => {
    try {
        const { q, page, limit } = req.query;
        const data = await notificationModel.adminGetOrderHistory({ q, page, limit });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};