const baiVietModel = require('../models/baiVietModel');
const cheerio = require('cheerio');

exports.listPublic = async (req, res) => {
  try {
    const { q, the_loai, page, limit } = req.query;
    const data = await baiVietModel.listPublic({ q, the_loai, page: Number(page) || 1, limit: Number(limit) || 12 });
    res.json(data);
  } catch (err) {
    console.error('[baiViet:listPublic]', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await baiVietModel.getById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    await baiVietModel.incrementViews(req.params.id);
    item.luot_xem += 1;
    res.json(item);
  } catch (err) {
    console.error('[baiViet:getById]', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Admin
exports.adminList = async (req, res) => {
  try {
    const { q, the_loai, trang_thai, page, limit } = req.query;
    const data = await baiVietModel.adminList({ q, the_loai, trang_thai, page: Number(page) || 1, limit: Number(limit) || 20 });
    res.json(data);
  } catch (err) {
    console.error('[baiViet:adminList]', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.create = async (req, res) => {
  try {
    const { tieu_de, noi_dung } = req.body;
    if (!tieu_de?.trim()) return res.status(400).json({ message: 'Thiếu tiêu đề' });
    if (!noi_dung?.trim()) return res.status(400).json({ message: 'Thiếu nội dung' });
    const result = await baiVietModel.create(req.body);
    res.status(201).json({ message: 'Tạo bài viết thành công', ...result });
  } catch (err) {
    console.error('[baiViet:create]', err);
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    await baiVietModel.update(req.params.id, req.body);
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('[baiViet:update]', err);
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await baiVietModel.remove(req.params.id);
    res.json({ message: 'Xóa bài viết thành công' });
  } catch (err) {
    console.error('[baiViet:remove]', err);
    res.status(400).json({ message: err.message });
  }
};

exports.importUrl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url?.trim()) return res.status(400).json({ message: 'Thiếu URL' });

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': new URL(url).origin + '/',
      },
      signal: AbortSignal.timeout(20000),
      redirect: 'follow',
    });
    if (!response.ok) return res.status(400).json({ message: `Không thể truy cập trang (HTTP ${response.status}). Trang có thể đang chặn truy cập hoặc không tồn tại.` });

    const html = await response.text();
    const $ = cheerio.load(html);

    $('script, style, nav, footer, header, .sidebar, .menu, .ad, .advertisement, .related, .comment, .share, .social').remove();

    let tieu_de = '';
    if ($('meta[property="og:title"]').length) tieu_de = $('meta[property="og:title"]').attr('content') || '';
    if (!tieu_de) tieu_de = $('title').text() || '';
    if (!tieu_de) tieu_de = $('h1').first().text() || '';
    // Strip site name from title (e.g. "Title - Site Name" or "Title | Site Name")
    tieu_de = tieu_de.replace(/\s*[-|–]\s*[^-|–]+$/, '').replace(/\s*\|\s*[^|]+$/, '').trim();

    let tom_tat = '';
    if ($('meta[property="og:description"]').length) tom_tat = $('meta[property="og:description"]').attr('content') || '';
    if (!tom_tat) tom_tat = $('meta[name="description"]').attr('content') || '';
    if (!tom_tat) tom_tat = $('p').first().text().substring(0, 300) || '';

    let hinh_anh = '';
    if ($('meta[property="og:image"]').length) hinh_anh = $('meta[property="og:image"]').attr('content') || '';

    let noi_dung = '';
    const contentSelectors = ['article', '.post-content', '.entry-content', '.article-content', '.content', '.article-body', '.post-body', 'main'];
    for (const sel of contentSelectors) {
      if ($(sel).length) { noi_dung = $(sel).html() || ''; break; }
    }
    if (!noi_dung) {
      const body = $('body');
      body.find('script, style, nav, footer, header, .sidebar, .menu, .ad, .comment').remove();
      noi_dung = body.html() || '';
    }

    noi_dung = noi_dung
      .replace(/class="[^"]*"/g, '')
      .replace(/style="[^"]*"/g, '')
      .replace(/id="[^"]*"/g, '')
      .replace(/<div\s*>\s*<\/div>/gi, '')
      .replace(/<span\s*>\s*<\/span>/gi, '')
      .replace(/<p\s*>\s*<\/p>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!tieu_de && !noi_dung) {
      return res.status(400).json({ message: 'Không thể trích xuất nội dung. Trang có thể đang bảo vệ bởi Cloudflare hoặc không có nội dung HTML.' });
    }

    res.json({ tieu_de: tieu_de.trim(), tom_tat: tom_tat.trim(), noi_dung, hinh_anh });
  } catch (err) {
    console.error('[baiViet:importUrl]', err);
    res.status(400).json({ message: err.message || 'Không thể lấy nội dung từ URL' });
  }
};
