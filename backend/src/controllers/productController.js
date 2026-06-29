const productModel = require('../models/productModel');

async function getProducts(req, res) {
    try {
        const { q, category, sort, in_stock, page, limit } = req.query;
        const data = await productModel.listProducts({ q, category, sort, inStock: in_stock, page, limit });
        res.json(data);
    } catch (err) {
        console.error('[getProducts]', err);
        res.status(500).json({ message: err.message });
    }
}

async function getProductById(req, res) {
    try {
        const product = await productModel.getProductById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.json({ product });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getProductReviews(req, res) {
    try {
        const reviews = await productModel.getReviews(req.params.id);
        res.json({ reviews });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createReview(req, res) {
    try {
        const { ma_san_pham, so_sao, noi_dung } = req.body;
        if (!ma_san_pham || !so_sao) return res.status(400).json({ message: 'Thiếu thông tin đánh giá' });
        const id = await productModel.createReview({
            masp: ma_san_pham,
            mand: req.user.id,
            so_sao,
            binh_luan: noi_dung,
        });
        res.status(201).json({ message: 'Đánh giá thành công', id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function getCategories(req, res) {
    try {
        const categories = await productModel.listCategories();
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createProduct(req, res) {
    try {
        const id = await productModel.createProduct(req.body);
        res.status(201).json({ message: 'Tạo sản phẩm thành công', id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updateProduct(req, res) {
    try {
        await productModel.updateProduct(req.params.id, req.body);
        res.json({ message: 'Cập nhật sản phẩm thành công' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function toggleProduct(req, res) {
    try {
        await productModel.toggleProduct(req.params.id);
        res.json({ message: 'Đã thay đổi trạng thái sản phẩm' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getProducts, getProductById, getProductReviews, createReview, getCategories, createProduct, updateProduct, toggleProduct };