const crypto = require('crypto');

const VNPAY_VERSION = '2.1.0';
const DEFAULT_PAYMENT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

const pad = value => String(value).padStart(2, '0');

const formatVnpayDate = date =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

const getVnpayConfig = () => ({
  tmnCode: process.env.VNPAY_TMN_CODE,
  hashSecret: process.env.VNPAY_HASH_SECRET,
  paymentUrl: process.env.VNPAY_PAYMENT_URL || DEFAULT_PAYMENT_URL,
  returnUrl:
    process.env.VNPAY_RETURN_URL ||
    `http://localhost:${process.env.PORT || 5000}/api/payments/vnpay/return`,
});

const hasVnpayConfig = () => {
  const config = getVnpayConfig();
  return Boolean(config.tmnCode && config.hashSecret);
};

const sortVnpayParams = params =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .reduce((sorted, [key, value]) => ({ ...sorted, [key]: String(value) }), {});

const stringifyVnpayParams = params => new URLSearchParams(sortVnpayParams(params)).toString();

const signVnpayParams = (params, hashSecret) =>
  crypto.createHmac('sha512', hashSecret).update(stringifyVnpayParams(params), 'utf8').digest('hex');

const getClientIp = req => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
};

const createVnpayPaymentUrl = ({ orderId, amount, ipAddr }) => {
  const config = getVnpayConfig();
  if (!config.tmnCode || !config.hashSecret) {
    throw new Error('Chua cau hinh VNPAY_TMN_CODE va VNPAY_HASH_SECRET.');
  }

  const createdAt = new Date();
  const expiredAt = new Date(createdAt.getTime() + 15 * 60 * 1000);
  const params = sortVnpayParams({
    vnp_Version: VNPAY_VERSION,
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: Math.round(Number(amount) * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: `DH${orderId}-${Date.now()}`,
    vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: formatVnpayDate(createdAt),
    vnp_ExpireDate: formatVnpayDate(expiredAt),
  });

  const secureHash = signVnpayParams(params, config.hashSecret);
  return `${config.paymentUrl}?${stringifyVnpayParams({ ...params, vnp_SecureHash: secureHash })}`;
};

const verifyVnpayParams = rawParams => {
  const { hashSecret } = getVnpayConfig();
  const params = { ...rawParams };
  const secureHash = params.vnp_SecureHash;

  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  if (!hashSecret || !secureHash) {
    return { valid: false, params: sortVnpayParams(params) };
  }

  const signed = signVnpayParams(params, hashSecret);
  return {
    valid: signed.toLowerCase() === String(secureHash).toLowerCase(),
    params: sortVnpayParams(params),
  };
};

const orderIdFromTxnRef = txnRef => {
  const match = String(txnRef || '').match(/^DH(\d+)-/);
  return match ? Number(match[1]) : null;
};

module.exports = {
  createVnpayPaymentUrl,
  getClientIp,
  hasVnpayConfig,
  orderIdFromTxnRef,
  verifyVnpayParams,
};
