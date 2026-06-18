const productModel = require("../models/productModel");
const { normalizeStoredProductImages } = require("../utils/imageHelpers");

const parseQuery = (req, publicOnly = false) => ({
  publicOnly,
  q: (req.query.q || "").trim(),
  category: req.query.category || "",
  in_stock: req.query.in_stock,
  sort: req.query.sort || "moi_nhat",
  page: req.query.page,
  limit: req.query.limit,
});

exports.list = async (req, res) => {
  try {
    const result = await productModel.listProducts(parseQuery(req, true));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminList = async (req, res) => {
  try {
    const result = await productModel.listProducts(parseQuery(req, false));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.detail = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id, {
      publicOnly: true,
    });
    if (!product) {
      return res.status(404).json({ message: "Khong tim thay san pham." });
    }
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.categories = async (req, res) => {
  try {
    const categories = await productModel.listCategories({ publicOnly: true });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = normalizeProductPayload(req.body);
    const id = await productModel.createProduct(payload);
    const images = await normalizeStoredProductImages(req.body.hinh_anh || req.body.images || []);
    await productModel.replaceProductImages(id, images);
    res.status(201).json({ message: "Tao san pham thanh cong.", id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const payload = normalizeProductPayload(req.body);
    await productModel.updateProduct(req.params.id, payload);
    if (Array.isArray(req.body.hinh_anh) || Array.isArray(req.body.images)) {
      const images = await normalizeStoredProductImages(req.body.hinh_anh || req.body.images || []);
      await productModel.replaceProductImages(req.params.id, images);
    }
    res.json({ message: "Cap nhat san pham thanh cong." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggle = async (req, res) => {
  try {
    await productModel.toggleProduct(req.params.id);
    res.json({ message: "Cap nhat trang thai san pham thanh cong." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await productModel.deleteProduct(req.params.id);
    res.json({ message: "Xoa san pham thanh cong." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reviews = async (req, res) => {
  try {
    const reviews = await productModel.listReviews(req.params.id);
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function normalizeProductPayload(body) {
  const payload = {
    ten_san_pham: (body.ten_san_pham || "").trim(),
    ma_danh_muc: Number(body.ma_danh_muc || body.madm),
    gia_ban: Number(body.gia_ban || 0),
    ton_kho: Number(body.ton_kho ?? body.so_luong_ton ?? 0),
    don_vi: (body.don_vi || "kg").trim(),
    khu_vuc: (body.khu_vuc || body.tinh_thanh || "").trim(),
  };

  if (!payload.ten_san_pham) throw new Error("Vui long nhap ten san pham.");
  if (!payload.ma_danh_muc) throw new Error("Vui long chon danh muc.");
  if (payload.gia_ban < 0 || payload.ton_kho < 0) {
    throw new Error("Gia ban va ton kho khong hop le.");
  }

  return payload;
}
