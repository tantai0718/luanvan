export function getExpiryDiscountDaysLeft(hanSuDung, ngaySanXuat) {
  if (!hanSuDung) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nsx = ngaySanXuat ? new Date(ngaySanXuat) : null;
  const nsxDay = nsx ? new Date(nsx.getFullYear(), nsx.getMonth(), nsx.getDate()) : null;
  const refDate = (nsxDay && nsxDay > today) ? nsxDay : today;
  const expiry = new Date(hanSuDung);
  const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  return Math.round((expiryDay - refDate) / (1000 * 60 * 60 * 24));
}

export function getExpiryDiscountPercent(product) {
  if (!product || !product.han_su_dung || Number(product.phan_tram_giam_can_han || 0) <= 0 || Number(product.so_ngay_can_han || 0) < 0) return 0;
  const daysLeft = getExpiryDiscountDaysLeft(product.han_su_dung, product.ngay_san_xuat);
  if (daysLeft === null || daysLeft < 0 || daysLeft > Number(product.so_ngay_can_han)) return 0;
  return Number(product.phan_tram_giam_can_han || 0);
}

export function getExpiryDiscountAmount(product, quantity = 1) {
  const pct = getExpiryDiscountPercent(product);
  if (!pct) return 0;
  return Math.round(Number(product.gia_ban || 0) * Number(quantity || 0) * pct / 100);
}

export function getExpiryDiscountPrice(product) {
  const pct = getExpiryDiscountPercent(product);
  if (!pct) return null;
  return Math.round(Number(product.gia_ban || 0) * (100 - pct) / 100);
}
