const bannerModel = require("../models/bannerModel");
const { saveDataUrlImage } = require("../utils/imageHelpers");

const mapBanner = (banner) => ({
  id: banner.mabn,
  title: banner.tieu_de,
  description: banner.mo_ta,
  image: banner.hinh_anh,
  order: banner.thu_tu_hien_thi,
  active: Boolean(banner.trang_thai),
  created_at: banner.ngay_tao,
});

exports.list = async (req, res) => {
  try {
    await bannerModel.ensureBannerTable();
    const banners = await bannerModel.getActiveBanners();
    res.json({ banners: banners.map(mapBanner) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.listAll = async (req, res) => {
  try {
    await bannerModel.ensureBannerTable();
    const banners = await bannerModel.getAllBanners();
    res.json({ banners: banners.map(mapBanner) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    await bannerModel.ensureBannerTable();
    const {
      title = "",
      description = "",
      image,
      order = 1,
      active = true,
    } = req.body;
    const storedImage = await saveDataUrlImage(image, "banners", "banner");
    if (!storedImage)
      return res.status(400).json({ message: "Vui long chon anh banner." });
    const id = await bannerModel.createBanner({
      mand: req.user.id,
      tieu_de: title,
      hinh_anh: storedImage,
      mo_ta: description,
      thu_tu: order,
      trang_thai: active ? 1 : 0,
    });
    res.status(201).json({ message: "Tao banner thanh cong.", id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    await bannerModel.ensureBannerTable();
    const {
      title = "",
      description = "",
      image,
      order = 1,
      active = true,
    } = req.body;
    const storedImage = await saveDataUrlImage(image, "banners", "banner");
    if (!storedImage)
      return res.status(400).json({ message: "Vui long chon anh banner." });
    await bannerModel.updateBanner(req.params.id, {
      tieu_de: title,
      hinh_anh: storedImage,
      mo_ta: description,
      thu_tu: order,
      trang_thai: active ? 1 : 0,
    });
    res.json({ message: "Cap nhat banner thanh cong." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggle = async (req, res) => {
  try {
    await bannerModel.toggleBanner(req.params.id);
    res.json({ message: "Cap nhat banner thanh cong." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await bannerModel.deleteBanner(req.params.id);
    res.json({ message: "Xoa banner thanh cong." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
