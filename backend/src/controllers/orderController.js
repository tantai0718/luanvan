const orderModel = require("../models/orderModel");
const userModel = require("../models/userModel");
const db = require("../config/db");

const BANKING_INFO = {
  bank_name: process.env.BANK_BANK_NAME || 'Techcombank',
  bank_short_name: process.env.BANK_SHORT_NAME || 'TCB',
  account_number: process.env.BANK_ACCOUNT_NUMBER || '4718072003',
  account_holder: process.env.BANK_ACCOUNT_HOLDER || 'Vo Ngoc Tan Tai',
};

function getBankingInfo(amount, orderId) {
  const addInfo = `TT${orderId}`;
  const qrUrl = `https://img.vietqr.io/image/${BANKING_INFO.bank_short_name}-${BANKING_INFO.account_number}-compact.jpg?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(BANKING_INFO.account_holder)}`;
  return { ...BANKING_INFO, qr_url: qrUrl, amount, noi_dung_chuyen_khoan: addInfo };
}

async function createOrder(req, res) {
  try {
    const { dia_chi_giao, phuong_thuc_tt, ma_code, ghi_chu, ten_nguoi_nhan, sdt_nguoi_nhan } = req.body;
    if (!dia_chi_giao?.trim())
      return res
        .status(400)
        .json({ message: "Vui lòng nhập địa chỉ giao hàng." });
    const nguoi_dung = await userModel.findById(req.user.id);
    const { madh, tong_tien } = await orderModel.createOrder({
      mand: req.user.id,
      dia_chi_giao,
      phuong_thuc: phuong_thuc_tt || "tien_mat",
      ma_code: ma_code || "",
      ghi_chu: ghi_chu || "",
      nguoi_dung,
      ten_nguoi_nhan: ten_nguoi_nhan?.trim() || '',
      sdt_nguoi_nhan: sdt_nguoi_nhan?.trim() || '',
    });
    const response = {
      message: "Đặt hàng thành công",
      order: { id: madh, ma_don_hang: madh, tong_tien },
    };

    if (phuong_thuc_tt === "banking") {
      response.banking_info = getBankingInfo(tong_tien, madh);
    }

    res.status(201).json(response);
  } catch (err) {
    console.error("[createOrder]", err);
    res.status(400).json({ message: err.message });
  }
}

async function createPreorder(req, res) {
  try {
    const {
      product_id,
      quantity,
      dia_chi_giao,
      ghi_chu = "",
      phuong_thuc_tt,
      ngay_giao_du_kien,
      ten_nguoi_nhan,
      sdt_nguoi_nhan,
    } = req.body;

    if (!product_id)
      return res.status(400).json({ message: "Thiếu mã sản phẩm" });
    if (!quantity) return res.status(400).json({ message: "Thiếu số lượng" });
    if (!dia_chi_giao?.trim())
      return res
        .status(400)
        .json({ message: "Vui lòng nhập địa chỉ giao hàng" });

    const nguoi_dung = await userModel.findById(req.user.id);

    const [[sp]] = await db.query(
      "SELECT gia_ban FROM san_pham WHERE masp = ? AND trang_thai = 1",
      [product_id],
    );
    if (!sp) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    const { madh, tong_tien } = await orderModel.createPreorder({
      mand: req.user.id,
      masp: product_id,
      so_luong: quantity,
      gia_ban: sp.gia_ban,
      ngay_giao_du_kien,
      dia_chi_giao,
      phuong_thuc: phuong_thuc_tt || "tien_mat",
      ghi_chu,
      nguoi_dung,
      ten_nguoi_nhan: ten_nguoi_nhan?.trim() || '',
      sdt_nguoi_nhan: sdt_nguoi_nhan?.trim() || '',
    });

    const response = {
      message: "Đặt trước thành công",
      order: { id: madh, ma_don_hang: madh, tong_tien },
    };

    if (phuong_thuc_tt === "banking") {
      response.banking_info = getBankingInfo(tong_tien, madh);
    }

    res.status(201).json(response);
  } catch (err) {
    console.error("[createPreorder]", err);
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
    if (!raw)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    const order = { ...orderModel.mapOrder(raw), items: raw.items };
    if (order.phuong_thuc_tt === "banking" && order.trang_thai_tt !== "da_tt") {
      order.banking_info = getBankingInfo(order.tong_thanh_toan, order.id);
    }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function cancelOrder(req, res) {
  try {
    await orderModel.cancelOrder(req.params.id, req.user.id);
    res.json({ message: "Đã huỷ đơn hàng." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function adminGetOrders(req, res) {
  try {
    const { page, limit, trang_thai, loai_don } = req.query;

    const data = await orderModel.getAllOrders({
      page,
      limit,
      trang_thai,
      loai_don,
    });

    res.json({
      ...data,
      orders: data.orders.map(orderModel.mapOrder),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
async function adminUpdateStatus(req, res) {
  try {
    await orderModel.updateOrderStatus(req.params.id, req.body.trang_thai);
    res.json({ message: "Cập nhật trạng thái đơn hàng thành công." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
async function adminConfirmBanking(req, res) {
  try {
    await orderModel.confirmBankingPayment(req.params.id);
    res.json({ message: 'Xac nhan thanh toan chuyen khoan thanh cong.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function adminGetOrderById(req, res) {
  try {
    const raw = await orderModel.getOrderById(req.params.id);

    if (!raw) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng.",
      });
    }

    const order = {
      ...orderModel.mapOrder(raw),
      items: raw.items,
    };
    if (order.phuong_thuc_tt === "banking" && order.trang_thai_tt !== "da_tt") {
      order.banking_info = getBankingInfo(order.tong_thanh_toan, order.id);
    }
    res.json({ order });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
}

module.exports = {
  createOrder,
  createPreorder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  adminGetOrders,
  adminUpdateStatus,
  adminConfirmBanking,
  adminGetOrderById,
};
