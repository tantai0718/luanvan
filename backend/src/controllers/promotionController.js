const promotionModel = require("../models/promotionModel");

exports.getActivePromotions = async (req, res) => {
  try {
    const promotions = await promotionModel.getActivePromotions();
    res.json({ promotions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminGetAll = async (req, res) => {
  try {
    const promotions = await promotionModel.getAllPromotions();
    res.json({ promotions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminCreate = async (req, res) => {
  try {
    const {
      ten_km,
      loai_uu_dai,
      dieu_kien_toi_thieu,
      phan_tram_giam,
      gia_tri_giam_toi_da,
      ap_dung_cho,
      trang_thai,
    } = req.body;

    if (!ten_km || !loai_uu_dai || dieu_kien_toi_thieu === undefined) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ tên, loại ưu đãi và điều kiện tối thiểu." });
    }

    const promo = await promotionModel.createPromotion({
      ten_km,
      loai_uu_dai,
      dieu_kien_toi_thieu: Number(dieu_kien_toi_thieu),
      phan_tram_giam: phan_tram_giam ? Number(phan_tram_giam) : null,
      gia_tri_giam_toi_da: gia_tri_giam_toi_da ? Number(gia_tri_giam_toi_da) : null,
      ap_dung_cho: ap_dung_cho || "tat_ca",
      trang_thai: trang_thai !== undefined ? trang_thai : 1,
    });

    res.status(201).json({ message: "Tạo khuyến mãi thành công", promotion: promo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminUpdate = async (req, res) => {
  try {
    const makm = req.params.id;
    const existing = await promotionModel.getPromotionById(makm);
    if (!existing) {
      return res.status(404).json({ message: "Khuyến mãi không tồn tại." });
    }

    const {
      ten_km,
      loai_uu_dai,
      dieu_kien_toi_thieu,
      phan_tram_giam,
      gia_tri_giam_toi_da,
      ap_dung_cho,
      trang_thai,
    } = req.body;

    const updated = await promotionModel.updatePromotion(makm, {
      ten_km: ten_km || existing.ten_km,
      loai_uu_dai: loai_uu_dai || existing.loai_uu_dai,
      dieu_kien_toi_thieu: dieu_kien_toi_thieu !== undefined ? Number(dieu_kien_toi_thieu) : existing.dieu_kien_toi_thieu,
      phan_tram_giam: phan_tram_giam !== undefined ? (phan_tram_giam ? Number(phan_tram_giam) : null) : existing.phan_tram_giam,
      gia_tri_giam_toi_da: gia_tri_giam_toi_da !== undefined ? (gia_tri_giam_toi_da ? Number(gia_tri_giam_toi_da) : null) : existing.gia_tri_giam_toi_da,
      ap_dung_cho: ap_dung_cho || existing.ap_dung_cho,
      trang_thai: trang_thai !== undefined ? trang_thai : existing.trang_thai,
    });

    res.json({ message: "Cập nhật khuyến mãi thành công", promotion: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminToggleStatus = async (req, res) => {
  try {
    const makm = req.params.id;
    const updated = await promotionModel.togglePromotionStatus(makm);
    res.json({ message: "Cập nhật trạng thái thành công", promotion: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminDelete = async (req, res) => {
  try {
    const makm = req.params.id;
    const success = await promotionModel.deletePromotion(makm);
    if (!success) {
      return res.status(404).json({ message: "Khuyến mãi không tồn tại." });
    }
    res.json({ message: "Đã xóa khuyến mãi thành công." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
