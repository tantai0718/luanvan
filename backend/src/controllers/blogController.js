const blogModel = require('../models/blogModel');

exports.list = async (req, res) => {
  try {
    const { page, limit, madm } = req.query;
    const data = await blogModel.getAllPosts({ page: Number(page) || 1, limit: Number(limit) || 6, madm });
    const categories = await blogModel.getCategories();
    res.json({ ...data, categories });
  } catch (err) {
    console.error('[blog:list]', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.detail = async (req, res) => {
  try {
    const post = await blogModel.getPostById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    await blogModel.incrementViews(req.params.id);
    post.luot_xem += 1;
    const related = await blogModel.getRelated(post.madm, post.mabv, 3);
    res.json({ post, related });
  } catch (err) {
    console.error('[blog:detail]', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.create = async (req, res) => {
  try {
    const { tieu_de, noi_dung } = req.body;
    if (!tieu_de?.trim()) return res.status(400).json({ message: 'Thiếu tiêu đề' });
    if (!noi_dung?.trim()) return res.status(400).json({ message: 'Thiếu nội dung' });
    const mand = req.user?.id || 1;
    const result = await blogModel.create({ ...req.body, mand });
    res.status(201).json({ message: 'Tạo bài viết thành công', ...result });
  } catch (err) {
    console.error('[blog:create]', err);
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    await blogModel.update(req.params.id, data);
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('[blog:update]', err);
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await blogModel.remove(req.params.id);
    res.json({ message: 'Xóa bài viết thành công' });
  } catch (err) {
    console.error('[blog:remove]', err);
    res.status(400).json({ message: err.message });
  }
};

exports.categories = async (req, res) => {
  try {
    const cats = await blogModel.getCategories();
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};
