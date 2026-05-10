const isDirectImageValue = value =>
  value.startsWith('data:image/') ||
  value.startsWith('http://') ||
  value.startsWith('https://');

const parseImages = value => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (isDirectImageValue(trimmed)) {
      return [trimmed];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (typeof parsed === 'string' && parsed) return [parsed];
    } catch {}
  }

  return [];
};

const serializeImages = value => JSON.stringify(parseImages(value));

module.exports = { parseImages, serializeImages };
