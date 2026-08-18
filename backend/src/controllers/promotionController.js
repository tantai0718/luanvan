const promotionModel = require("../models/promotionModel");

exports.getActivePromotions = async (req, res) => {
  try {
    const promotions = await promotionModel.getActivePromotions();
    res.json({ promotions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /promotions/validate-code — dùng ở Cart.jsx để xem trước mã có hợp lệ & lợi hơn ưu đãi tự động không
// req.user.id lấy từ middleware auth, dùng để kiểm tra giới hạn mỗi tài khoản
exports.validateCode = async (req, res) => {
  try {
    const { ma_code, tong_tien, so_luong, loai_don } = req.body;
    if (!ma_code) return res.status(400).json({ message: "Vui lòng nhập mã giảm giá." });

    const result = await promotionModel.tinhUuDaiTuDong(
      Number(tong_tien) || 0,
      Number(so_luong) || 0,
      loai_don || 'thuong',
      ma_code,
      req.user?.id || null,
    );

    if (result.codeError) {
      return res.status(400).json({ message: result.codeError });
    }

    res.json({
      tien_giam: result.tienGiam,
      mien_phi_ship: result.mienPhiShip,
      used_code: result.usedCode,
      message: result.compareMessage,
      applied: result.appliedList,
    });
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
      ma_code,
      loai_uu_dai,
      loai_ap_dung,
      dieu_kien_toi_thieu,
      phan_tram_giam,
      gia_tri_giam_toi_da,
      ap_dung_cho,
      ngay_bat_dau,
      ngay_ket_thuc,
      so_luong_toi_da,
      gioi_han_moi_user,
      trang_thai,
    } = req.body;

    if (!ten_km || !loai_uu_dai || dieu_kien_toi_thieu === undefined) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ tên, loại ưu đãi và điều kiện tối thiểu." });
    }

    if (ngay_bat_dau && ngay_ket_thuc && new Date(ngay_ket_thuc) <= new Date(ngay_bat_dau)) {
      return res.status(400).json({ message: "Thời gian kết thúc (ngày và giờ) phải sau thời gian bắt đầu." });
    }

    const promo = await promotionModel.createPromotion({
      ten_km,
      ma_code: ma_code || null,
      loai_uu_dai,
      loai_ap_dung,
      dieu_kien_toi_thieu: Number(dieu_kien_toi_thieu),
      phan_tram_giam: phan_tram_giam ? Number(phan_tram_giam) : null,
      gia_tri_giam_toi_da: gia_tri_giam_toi_da ? Number(gia_tri_giam_toi_da) : null,
      ap_dung_cho: ap_dung_cho || "tat_ca",
      ngay_bat_dau: ngay_bat_dau || null,
      ngay_ket_thuc: ngay_ket_thuc || null,
      so_luong_toi_da: so_luong_toi_da ? Number(so_luong_toi_da) : null,
      gioi_han_moi_user: gioi_han_moi_user !== undefined ? Number(gioi_han_moi_user) : 1,
      trang_thai: trang_thai !== undefined ? trang_thai : 1,
    });

    res.status(201).json({ message: "Tạo khuyến mãi thành công", promotion: promo });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "Mã code này đã tồn tại, vui lòng chọn mã khác." });
    }
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
      ma_code,
      loai_uu_dai,
      loai_ap_dung,
      dieu_kien_toi_thieu,
      phan_tram_giam,
      gia_tri_giam_toi_da,
      ap_dung_cho,
      ngay_bat_dau,
      ngay_ket_thuc,
      so_luong_toi_da,
      gioi_han_moi_user,
      trang_thai,
    } = req.body;

    const startVal = ngay_bat_dau !== undefined ? ngay_bat_dau : existing.ngay_bat_dau;
    const endVal = ngay_ket_thuc !== undefined ? ngay_ket_thuc : existing.ngay_ket_thuc;
    if (startVal && endVal && new Date(endVal) <= new Date(startVal)) {
      return res.status(400).json({ message: "Thời gian kết thúc (ngày và giờ) phải sau thời gian bắt đầu." });
    }

    const updated = await promotionModel.updatePromotion(makm, {
      ten_km: ten_km || existing.ten_km,
      ma_code: ma_code !== undefined ? ma_code : existing.ma_code,
      loai_uu_dai: loai_uu_dai || existing.loai_uu_dai,
      loai_ap_dung: loai_ap_dung || existing.loai_ap_dung,
      dieu_kien_toi_thieu: dieu_kien_toi_thieu !== undefined ? Number(dieu_kien_toi_thieu) : existing.dieu_kien_toi_thieu,
      phan_tram_giam: phan_tram_giam !== undefined ? (phan_tram_giam ? Number(phan_tram_giam) : null) : existing.phan_tram_giam,
      gia_tri_giam_toi_da: gia_tri_giam_toi_da !== undefined ? (gia_tri_giam_toi_da ? Number(gia_tri_giam_toi_da) : null) : existing.gia_tri_giam_toi_da,
      ap_dung_cho: ap_dung_cho || existing.ap_dung_cho,
      ngay_bat_dau: ngay_bat_dau !== undefined ? ngay_bat_dau : existing.ngay_bat_dau,
      ngay_ket_thuc: ngay_ket_thuc !== undefined ? ngay_ket_thuc : existing.ngay_ket_thuc,
      so_luong_toi_da: so_luong_toi_da !== undefined ? (so_luong_toi_da ? Number(so_luong_toi_da) : null) : existing.so_luong_toi_da,
      gioi_han_moi_user: gioi_han_moi_user !== undefined ? Number(gioi_han_moi_user) : existing.gioi_han_moi_user,
      trang_thai: trang_thai !== undefined ? trang_thai : existing.trang_thai,
    });

    res.json({ message: "Cập nhật khuyến mãi thành công", promotion: updated });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "Mã code này đã tồn tại, vui lòng chọn mã khác." });
    }
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