const productModel = require('../models/productModel');

const db = require('../config/db');
const fs = require('fs');
const path = require('path');


async function getProducts(req, res) {
    try {
        const { q, category, sort, in_stock, page, limit } = req.query;

        // Nếu request đến từ /admin/products thì lấy tất cả, không filter trang_thai
        const isAdmin = req.originalUrl.includes('/admin/');
        const data = isAdmin
            ? await productModel.listAllProducts({ q, category })
            : await productModel.listProducts({ q, category, sort, inStock: in_stock, page, limit });

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
        // Frontend gửi: ten_san_pham, ma_danh_muc, gia_ban, don_vi, ton_kho, hinh_anh[]
        // Model nhận:   ten_san_pham, madm,         gia_ban, don_vi, so_luong_ton, khu_vuc
        const { ten_san_pham, ma_danh_muc, gia_ban, don_vi, ton_kho, mo_ta, hinh_anh = [] } = req.body;

        if (!ten_san_pham?.trim()) return res.status(400).json({ message: 'Ten san pham khong duoc de trong.' });
        if (!ma_danh_muc) return res.status(400).json({ message: 'Vui long chon danh muc.' });

        const id = await productModel.createProduct({
            madm: Number(ma_danh_muc),  // map ma_danh_muc → madm
            ten_san_pham: ten_san_pham.trim(),
            mo_ta: mo_ta || '',
            gia_ban: Number(gia_ban || 0),
            don_vi: don_vi || 'kg',
            so_luong_ton: Number(ton_kho || 0), // map ton_kho → so_luong_ton
            khu_vuc: '',
        });

        // Nếu có ảnh → upload từng ảnh base64 vào hinh_anh_video
        if (hinh_anh.length > 0) {
            for (let i = 0; i < hinh_anh.length; i++) {
                const base64 = hinh_anh[i];
                const isVideo = base64.startsWith('data:video/');
                const loai = isVideo ? 'video' : 'hinh_anh';

                let ext = '.jpg';
                if (isVideo) {
                    ext = base64.includes('webm') ? '.webm' : '.mp4';
                } else if (base64.startsWith('data:image/png')) {
                    ext = '.png';
                }

                const safeName = `${Date.now()}_${i}${ext}`;
                const uploadDir = path.join(__dirname, '..', '..', 'upload', 'products');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                const data = base64.replace(/^data:(image|video)\/\w+;base64,/, '');
                fs.writeFileSync(path.join(uploadDir, safeName), Buffer.from(data, 'base64'));

                await db.query(
                    `INSERT INTO hinh_anh_video (masp, duong_dan, loai, la_chinh, thu_tu, ngay_tao)
       VALUES (?, ?, ?, ?, ?, NOW())`,
                    [id, `products/${safeName}`, loai, !isVideo && i === 0 ? 1 : 0, i]
                );
            }
        }

        res.status(201).json({ message: 'Tao san pham thanh cong', id });
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

async function deleteProduct(req, res) {
    try {
        await db.query('DELETE FROM hinh_anh_video WHERE masp = ?', [req.params.id]);
        await db.query('DELETE FROM san_pham WHERE masp = ?', [req.params.id]);
        res.json({ message: 'Da xoa san pham' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function uploadImage(req, res) {
    try {
        const { base64, filename, masp } = req.body;
        if (!base64 || !filename) return res.status(400).json({ message: 'Thieu du lieu anh' });

        const uploadDir = path.join(__dirname, '..', '..', 'upload', 'products');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const ext = path.extname(filename) || '.jpg';
        const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
        const filePath = path.join(uploadDir, safeName);
        const data = base64.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

        const duong_dan = `products/${safeName}`;

        if (masp) {
            const [[existing]] = await db.query(
                'SELECT COUNT(*) AS count FROM hinh_anh_video WHERE masp = ? AND la_chinh = 1', [masp]
            );
            const la_chinh = existing.count === 0 ? 1 : 0;
            await db.query(
                `INSERT INTO hinh_anh_video (masp, duong_dan, loai, la_chinh, thu_tu, ngay_tao)
         VALUES (?, ?, 'hinh_anh', ?, 0, NOW())`,
                [masp, duong_dan, la_chinh]
            );
        }

        res.json({ duong_dan, url: `/upload/${duong_dan}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


module.exports = { getProducts, getProductById, getProductReviews, createReview, getCategories, createProduct, updateProduct, toggleProduct, deleteProduct, uploadImage };