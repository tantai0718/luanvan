const accountModel = require("../models/accountModel");

exports.list = async (req, res) => {
  try {
    const result = await accountModel.listAccounts({
      q: (req.query.q || "").trim(),
      vai_tro: req.query.vai_tro || "",
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggle = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id === Number(req.user.id)) {
      return res.status(400).json({ message: "Khong the khoa tai khoan dang dang nhap." });
    }

    const account = await accountModel.findAccountById(id);
    if (!account) return res.status(404).json({ message: "Khong tim thay tai khoan." });

    await accountModel.toggleAccount(id);
    res.json({ message: "Cap nhat trang thai tai khoan thanh cong." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
