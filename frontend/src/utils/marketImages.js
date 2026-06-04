export const categoryImageMap = {
  1: '/images/trai_cay.webp',
  2: '/images/raucu.webp',
  3: '/images/ngucoc.jpg',
  4: '/images/gia_vi.jpg',
  5: '/images/gia_vi.jpg',
};

export const categorySlugImageMap = {
  'trai-cay': '/images/trai_cay.webp',
  'rau-cu': '/images/raucu.webp',
  'ngu-coc': '/images/ngucoc.jpg',
  'gia-vi': '/images/gia_vi.jpg',
};

export const productImageMap = [
  { terms: ['xoài', 'xoai'], image: '/images/trai_cay.webp' },
  { terms: ['cà chua', 'ca chua'], image: '/images/raucu.webp' },
  { terms: ['gạo', 'gao', 'st25'], image: '/images/ngucoc.jpg' },
  { terms: ['gia vị', 'gia vi', 'tiêu', 'tieu'], image: '/images/gia_vi.jpg' },
];

export const fallbackImage = '/images/farm2table-ecology.png';

export const pickProductImage = product => {
  const existing = product?.images?.find(Boolean);
  if (existing) return existing;

  const name = String(product?.ten_san_pham || product?.name || '').toLowerCase();
  const match = productImageMap.find(item => item.terms.some(term => name.includes(term)));
  if (match) return match.image;

  return categoryImageMap[product?.ma_danh_muc] || fallbackImage;
};

export const pickCategoryImage = category => {
  return categorySlugImageMap[category?.slug] || categoryImageMap[category?.id] || fallbackImage;
};
