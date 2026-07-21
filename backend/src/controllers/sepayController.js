const crypto = require('crypto');
const db = require('../config/db');
const orderModel = require('../models/orderModel');

function verifyHmac(rawBody, signature, timestamp) {
  const secret = process.env.SEPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !timestamp) return false;
  const cleanSig = signature.replace('sha256=', '');
  const payload = timestamp + '.' + rawBody;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (expected.length !== cleanSig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(cleanSig));
}

exports.webhook = async (req, res) => {
  try {
    const signature = req.headers['x-sepay-signature'];
    const timestamp = req.headers['x-sepay-timestamp'];
    if (!signature || !timestamp) {
      return res.status(400).json({ success: false });
    }
    if (!verifyHmac(req.rawBody, signature, timestamp)) {
      return res.status(401).json({ success: false });
    }
    const { id, code, content, transferAmount, transferType } = req.body;
    if (!id) return res.status(400).json({ success: false });
    const [[existing]] = await db.query(
      'SELECT id FROM sepay_webhook_logs WHERE transaction_id = ?', [id]
    );
    if (existing) return res.json({ success: true });
    await db.query(
      'INSERT IGNORE INTO sepay_webhook_logs (transaction_id, body) VALUES (?, ?)',
      [id, JSON.stringify(req.body)]
    );
    if (transferType !== 'in') {
      return res.json({ success: true });
    }
    const paymentCode = code || (content || '').match(/TT\d+/)?.[0] || null;
    if (!paymentCode) return res.json({ success: true });
    const match = paymentCode.match(/TT(\d+)/);
    if (!match) return res.json({ success: true });
    const madh = Number(match[1]);
    const [[order]] = await db.query(
      'SELECT madh, tong_tien, tien_coc, trang_thai_thanh_toan FROM don_hang WHERE madh = ?', [madh]
    );
    if (!order || order.trang_thai_thanh_toan === 'da_thanh_toan') {
      return res.json({ success: true });
    }
    const depositAmount = Number(order.tien_coc || 0);
    const requiredAmount = depositAmount > 0 ? depositAmount : order.tong_tien;
    if (transferAmount < requiredAmount) {
      return res.json({ success: true });
    }
    await orderModel.updatePaymentSuccess(madh, {
      ma_giao_dich: String(id),
      du_lieu_cong: JSON.stringify(req.body),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[SepayWebhook]', err);
    res.status(500).json({ success: false });
  }
};
