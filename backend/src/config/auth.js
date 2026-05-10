require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'cho_nong_san_dev_secret';

if (!process.env.JWT_SECRET) {
  console.warn('[auth] JWT_SECRET is missing in .env, using local development fallback secret.');
}

const isBcryptHash = value =>
  typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);

module.exports = { JWT_SECRET, isBcryptHash };
