const STORAGE_KEY = 'market_address_book';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAddresses(userId) {
  if (!userId) return [];
  return readAll()[userId] || [];
}

export function getDefaultAddress(userId) {
  return getAddresses(userId).find(a => a.is_default) || null;
}

export function addAddress(userId, { dia_chi, ten_nguoi_nhan = '', sdt_nguoi_nhan = '' }) {
  if (!userId || !dia_chi?.trim()) return null;
  const all = readAll();
  const list = all[userId] || [];
  const isFirst = list.length === 0;
  const address = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    dia_chi: dia_chi.trim(),
    ten_nguoi_nhan,
    sdt_nguoi_nhan,
    is_default: isFirst,
    ngay_tao: new Date().toISOString(),
  };
  all[userId] = [...list, address];
  writeAll(all);
  return address;
}

export function updateAddress(userId, id, patch) {
  if (!userId) return;
  const all = readAll();
  all[userId] = (all[userId] || []).map(a => (a.id === id ? { ...a, ...patch } : a));
  writeAll(all);
}

export function setDefaultAddress(userId, id) {
  if (!userId) return;
  const all = readAll();
  all[userId] = (all[userId] || []).map(a => ({ ...a, is_default: a.id === id }));
  writeAll(all);
}

export function removeAddress(userId, id) {
  if (!userId) return;
  const all = readAll();
  const list = (all[userId] || []).filter(a => a.id !== id);
  if (list.length && !list.some(a => a.is_default)) {
    list[0] = { ...list[0], is_default: true };
  }
  all[userId] = list;
  writeAll(all);
}
