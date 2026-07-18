const reviewModel = require('../models/reviewModel');

exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await reviewModel.getReviewsByProduct(req.params.id);
        res.json({ reviews });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createReview = async (req, res) => {
    try {
        const { ma_san_pham, so_sao, noi_dung } = req.body;
        if (!ma_san_pham || !so_sao) return res.status(400).json({ message: 'Thiếu thông tin đánh giá' });
        const id = await reviewModel.createReview({
            masp: ma_san_pham,
            mand: req.user.id,
            so_sao,
            binh_luan: noi_dung,
        });
        res.status(201).json({ message: 'Đánh giá thành công', id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.adminGetReviews = async (req, res) => {
    try {
        const { q, star, replied, page, limit } = req.query;
        const data = await reviewModel.listAllReviews({ q, star, replied, page, limit });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.adminReplyReview = async (req, res) => {
    try {
        const { phan_hoi } = req.body;
        if (!phan_hoi?.trim()) return res.status(400).json({ message: 'Nội dung phản hồi không được để trống' });
        await reviewModel.replyReview(req.params.id, phan_hoi.trim());
        res.json({ message: 'Đã gửi phản hồi' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.adminDeleteReply = async (req, res) => {
    try {
        await reviewModel.deleteReply(req.params.id);
        res.json({ message: 'Đã xóa phản hồi' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};