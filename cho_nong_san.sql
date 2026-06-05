
CREATE DATABASE IF NOT EXISTS cho_nong_san;
USE cho_nong_san;

-- ==========================================
-- 1. BẢNG VAI TRÒ
-- ==========================================
CREATE TABLE vai_tro (
    mavt INT AUTO_INCREMENT PRIMARY KEY,
    ten_vai_tro VARCHAR(50),
    mo_ta TEXT,
    trang_thai BOOLEAN
);

INSERT INTO vai_tro (ten_vai_tro, mo_ta, trang_thai) VALUES 
('Admin', 'Quản trị viên toàn quyền hệ thống', 1),
('User', 'Người dùng/Khách hàng tham gia sàn', 1);


-- ==========================================
-- 2. BẢNG NGƯỜI DÙNG
-- ==========================================
CREATE TABLE nguoi_dung (
    mand INT AUTO_INCREMENT PRIMARY KEY,
    mavt INT NOT NULL,
    ho_ten VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    mat_khau VARCHAR(225),
    sdt VARCHAR(20),
    dia_chi VARCHAR(150),
    trang_thai BOOLEAN,

    CONSTRAINT fk_nd_vt
    FOREIGN KEY (mavt) REFERENCES vai_tro(mavt)
);

INSERT INTO nguoi_dung (mavt, ho_ten, email, mat_khau, sdt, dia_chi, trang_thai) VALUES 
(1, 'Nguyễn Minh Giàu', 'minhgiau.admin@gmail.com', 'hash_password_admin', '0901234567', 'Thành phố Hồ Chí Minh', 1),
(2, 'Trần Thị Mua', 'thimua.user@gmail.com', 'hash_password_user1', '0918765432', 'Cần Thơ', 1),
(2, 'Lê Văn Khách', 'vankhach.user@gmail.com', 'hash_password_user2', '0987654321', 'Đồng Tháp', 1);


-- ==========================================
-- 3. BẢNG BANNER
-- ==========================================
CREATE TABLE banner (
    mabn INT AUTO_INCREMENT PRIMARY KEY,
    mand INT NOT NULL,
    tieu_de VARCHAR(150),
    hinh_anh VARCHAR(255),
    mo_ta TEXT,
    vi_tri ENUM('top','middle','bottom'),
    thu_tu_hien_thi INT,
    ngay_bat_dau DATETIME,
    ngay_ket_thuc DATETIME,
    trang_thai BOOLEAN,
    ngay_tao DATETIME,

    CONSTRAINT fk_banner_nd
    FOREIGN KEY (mand) REFERENCES nguoi_dung(mand)
);

INSERT INTO banner (mand, tieu_de, hinh_anh, mo_ta, vi_tri, thu_tu_hien_thi, ngay_bat_dau, ngay_ket_thuc, trang_thai, ngay_tao) VALUES 
(1, 'Nông Sản Mùa Vụ Mới', 'banner_tet_2026.png', 'Chương trình nông sản sạch đón Tết 2026', 'top', 1, '2026-01-01 00:00:00', '2026-02-15 23:59:59', 1, '2026-01-01 08:00:00'),
(1, 'Khuyến Mãi Cuối Tuần', 'banner_weekend.png', 'Giảm giá 10% rau củ hữu cơ', 'middle', 2, '2026-06-01 00:00:00', '2026-06-30 23:59:59', 1, '2026-05-28 09:30:00');


-- ==========================================
-- 4. BẢNG THÔNG BÁO
-- ==========================================
CREATE TABLE thong_bao (
    matb INT AUTO_INCREMENT PRIMARY KEY,
    mand INT NOT NULL,
    tieu_de VARCHAR(150),
    noi_dung TEXT,
    loai ENUM('he_thong','khuyen_mai','don_hang'),
    da_doc BOOLEAN,
    ngay_tao DATETIME,

    CONSTRAINT fk_tb_nd
    FOREIGN KEY (mand) REFERENCES nguoi_dung(mand)
);

INSERT INTO thong_bao (mand, tieu_de, noi_dung, loai, da_doc, ngay_tao) VALUES 
(2, 'Đơn hàng đã đặt thành công', 'Đơn hàng #DH1001 của bạn đã được tiếp nhận.', 'don_hang', 0, '2026-06-04 10:00:00'),
(1, 'Báo cáo hệ thống định kỳ', 'Hệ thống đã tự động tối ưu hóa tài nguyên tuần này.', 'he_thong', 1, '2026-06-03 14:20:00');


-- ==========================================
-- 5. BẢNG PHIÊN CHAT
-- ==========================================
CREATE TABLE phien_chat (
    mapc INT AUTO_INCREMENT PRIMARY KEY,
    mand INT NOT NULL,
    session_token VARCHAR(255),
    ngay_bat_dau DATETIME,
    ngay_ket_thuc DATETIME,
    trang_thai ENUM('dang_hoat_dong','da_dong'),

    CONSTRAINT fk_pc_nd
    FOREIGN KEY (mand) REFERENCES nguoi_dung(mand)
);

INSERT INTO phien_chat (mand, session_token, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES 
(2, 'token_abc123xyz', '2026-06-04 15:30:00', NULL, 'dang_hoat_dong'),
(3, 'token_def456uvw', '2026-06-03 09:00:00', '2026-06-03 09:45:00', 'da_dong');


-- ==========================================
-- 6. BẢNG TIN NHẮN CHAT
-- ==========================================
CREATE TABLE tin_nhan_chat (
    matnc INT AUTO_INCREMENT PRIMARY KEY,
    mapc INT NOT NULL,
    vai_tro ENUM('user','bot','admin'),
    noi_dung TEXT,
    loai_phien_only JSON,
    loai_gui_y ENUM('san_pham','ho_tro','khuyen_mai'),
    thoi_gian DATETIME,

    CONSTRAINT fk_tnc_pc
    FOREIGN KEY (mapc) REFERENCES phien_chat(mapc)
);

INSERT INTO tin_nhan_chat (mapc, vai_tro, noi_dung, loai_phien_only, loai_gui_y, thoi_gian) VALUES 
(1, 'user', 'Tôi muốn tìm mua trái cây miền Tây', '{}', 'san_pham', '2026-06-04 15:31:00'),
(1, 'bot', 'Hệ thống gợi ý cho bạn một số sản phẩm nổi bật:', '{"suggested_ids": [1]}', 'san_pham', '2026-06-04 15:31:05');


-- ==========================================
-- 7. BẢNG FILE HÌNH ẢNH
-- ==========================================
CREATE TABLE file_hinh_anh (
    maffha INT AUTO_INCREMENT PRIMARY KEY,
    matnc INT NOT NULL,
    ten_file VARCHAR(255),
    duong_dan VARCHAR(255),
    loai_file VARCHAR(50),
    kich_thuoc FLOAT,
    dinh_dang VARCHAR(20),
    ngay_tao DATETIME,

    CONSTRAINT fk_fha_tnc
    FOREIGN KEY (matnc) REFERENCES tin_nhan_chat(matnc)
);

INSERT INTO file_hinh_anh (matnc, ten_file, duong_dan, loai_file, kich_thuoc, dinh_dang, ngay_tao) VALUES 
(1, 'anh_mau_trai_cay.png', 'uploads/chat/anh_mau.png', 'image/png', 1024.5, 'png', '2026-06-04 15:31:00');


-- ==========================================
-- 8. BẢNG DANH MỤC
-- ==========================================
CREATE TABLE danh_muc (
    madm INT AUTO_INCREMENT PRIMARY KEY,
    ten_danh_muc VARCHAR(100),
    mo_ta TEXT,
    trang_thai BOOLEAN
);

INSERT INTO danh_muc (ten_danh_muc, mo_ta, trang_thai) VALUES 
('Trái Cây', 'Các loại trái cây tươi ngon bốn mùa', 1),
('Rau Củ Quả', 'Rau củ hữu cơ, VietGAP an toàn sinh học', 1),
('Gạo & Ngũ Cốc', 'Gạo đặc sản và các loại hạt dinh dưỡng', 1);


-- ==========================================
-- 9. BẢNG SẢN PHẨM
-- ==========================================
CREATE TABLE san_pham (
    masp INT AUTO_INCREMENT PRIMARY KEY,
    madm INT NOT NULL,
    ten_san_pham VARCHAR(150),
    gia_ban DECIMAL(12,2),
    so_luong_ton INT,
    don_vi VARCHAR(30),
    khu_vuc VARCHAR(100),
    trang_thai BOOLEAN,
    ngay_tao DATETIME,

    CONSTRAINT fk_sp_dm
    FOREIGN KEY (madm) REFERENCES danh_muc(madm)
);

INSERT INTO san_pham (madm, ten_san_pham, gia_ban, so_luong_ton, don_vi, khu_vuc, trang_thai, ngay_tao) VALUES 
(1, 'Xoài Cát Chu Lộc Phát', 45000.00, 500, 'Kg', 'Đồng Tháp', 1, '2026-05-20 07:00:00'),
(2, 'Cà Chua Bi Hữu Cơ', 35000.00, 200, 'Kg', 'Đà Lạt', 1, '2026-05-22 08:30:00'),
(3, 'Gạo ST25 Chuẩn Sạch', 32000.00, 1000, 'Kg', 'Sóc Trăng', 1, '2026-05-25 09:00:00');


-- ==========================================
-- 10. BẢNG GIỎ HÀNG
-- ==========================================
CREATE TABLE gio_hang (
    magh INT AUTO_INCREMENT PRIMARY KEY,
    mand INT NOT NULL,
    ngay_tao DATETIME,

    CONSTRAINT fk_gh_nd
    FOREIGN KEY (mand) REFERENCES nguoi_dung(mand)
);

INSERT INTO gio_hang (mand, ngay_tao) VALUES 
(2, '2026-06-01 11:00:00'),
(3, '2026-06-02 14:00:00');


-- ==========================================
-- 11. BẢNG CHI TIẾT GIỎ HÀNG
-- ==========================================
CREATE TABLE chi_tiet_gio_hang (
    mactgh INT AUTO_INCREMENT PRIMARY KEY,
    magh INT NOT NULL,
    masp INT NOT NULL,
    so_luong INT,

    CONSTRAINT fk_ctgh_gh
    FOREIGN KEY (magh) REFERENCES gio_hang(magh),

    CONSTRAINT fk_ctgh_sp
    FOREIGN KEY (masp) REFERENCES san_pham(masp)
);

INSERT INTO chi_tiet_gio_hang (magh, masp, so_luong) VALUES 
(1, 1, 3),
(1, 2, 2);


-- ==========================================
-- 12. BẢNG HÌNH ẢNH VIDEO
-- ==========================================
CREATE TABLE hinh_anh_video (
    mahav INT AUTO_INCREMENT PRIMARY KEY,
    masp INT NOT NULL,
    duong_dan VARCHAR(255),
    loai ENUM('hinh_anh','video'),
    thumbnail VARCHAR(255),
    thu_tu INT,
    la_chinh BOOLEAN,
    ngay_tao DATETIME,

    CONSTRAINT fk_hav_sp
    FOREIGN KEY (masp) REFERENCES san_pham(masp)
);

INSERT INTO hinh_anh_video (masp, duong_dan, loai, thumbnail, thu_tu, la_chinh, ngay_tao) VALUES 
(1, 'products/xoai_chu_1.png', 'hinh_anh', 'products/xoai_chu_1_thumb.png', 1, 1, '2026-05-20 07:05:00'),
(1, 'products/clip_thu_hoach_xoai.mp4', 'video', 'products/video_thumb.png', 2, 0, '2026-05-20 07:06:00');


-- ==========================================
-- 13. BẢNG ĐÁNH GIÁ
-- ==========================================
CREATE TABLE danh_gia (
    madg INT AUTO_INCREMENT PRIMARY KEY,
    mand INT NOT NULL,
    masp INT NOT NULL,
    so_sao INT,
    binh_luan TEXT,
    ngay_danh_gia DATETIME,

    CONSTRAINT fk_dg_nd
    FOREIGN KEY (mand) REFERENCES nguoi_dung(mand),

    CONSTRAINT fk_dg_sp
    FOREIGN KEY (masp) REFERENCES san_pham(masp)
);

INSERT INTO danh_gia (mand, masp, so_sao, binh_luan, ngay_danh_gia) VALUES 
(2, 1, 5, 'Xoài rất ngọt, đóng gói kỹ, giao hàng nhanh mát.', '2026-06-04 16:00:00');


-- ==========================================
-- 14. BẢNG MÙA VỤ
-- ==========================================
CREATE TABLE mua_vu (
    mamv INT AUTO_INCREMENT PRIMARY KEY,
    masp INT NOT NULL,
    ten_mua VARCHAR(100),
    thang_bat_dau DATETIME,
    thang_ket_thuc DATETIME,
    mo_ta TEXT,
    trang_thai BOOLEAN,

    CONSTRAINT fk_mv_sp
    FOREIGN KEY (masp) REFERENCES san_pham(masp)
);

INSERT INTO mua_vu (masp, ten_mua, thang_bat_dau, thang_ket_thuc, mo_ta, trang_thai) VALUES 
(1, 'Mùa Thu Hoạch Rộ Xoài Cát', '2026-04-01 00:00:00', '2026-07-31 23:59:59', 'Giai đoạn xoài chín ngọt và có sản lượng lớn nhất năm', 1);


-- ==========================================
-- 15. BẢNG ĐĂNG KÝ SẢN PHẨM
-- ==========================================
CREATE TABLE dang_ky_san_pham (
    madk INT AUTO_INCREMENT PRIMARY KEY,
    mand INT NOT NULL,
    masp INT NOT NULL,
    loai_dang_ky ENUM('dat_truoc','dinh_ky'),
    so_luong INT,
    gia_du_kien DECIMAL(12,2),
    chu_ky ENUM('hang_tuan','hang_thang'),
    ngay_bat_dau DATETIME,
    ngay_ket_thuc DATETIME,
    so_lan_giao INT,
    so_lan_da_giao INT,
    trang_thai ENUM('dang_hoat_dong','tam_dung','hoan_thanh'),
    ghi_chu TEXT,

    CONSTRAINT fk_dksp_nd
    FOREIGN KEY (mand) REFERENCES nguoi_dung(mand),

    CONSTRAINT fk_dksp_sp
    FOREIGN KEY (masp) REFERENCES san_pham(masp)
);

INSERT INTO dang_ky_san_pham (mand, masp, loai_dang_ky, so_luong, gia_du_kien, chu_ky, ngay_bat_dau, ngay_ket_thuc, so_lan_giao, so_lan_da_giao, trang_thai, ghi_chu) VALUES 
(2, 3, 'dinh_ky', 10, 30000.00, 'hang_thang', '2026-06-01 00:00:00', '2026-11-01 00:00:00', 5, 1, 'dang_hoat_dong', 'Giao gạo vào ngày 5 hàng tháng');


-- ==========================================
-- 16. BẢNG KHUYẾN MÃI
-- ==========================================
CREATE TABLE khuyen_mai (
    makm INT AUTO_INCREMENT PRIMARY KEY,
    ten_km VARCHAR(150),
    ma_code VARCHAR(50),
    ngay_bat_dau DATETIME,
    ngay_ket_thuc DATETIME,
    so_luong INT,
    da_su_dung INT,
    trang_thai BOOLEAN,
    loai_khuyen_mai ENUM('phan_tram','tien_mat'),
    hai_loai_toi_thieu INT,
    phan_tram_giam DECIMAL(5,2),
    gia_tri_giam_toi_da DECIMAL(15,2)
);

INSERT INTO khuyen_mai (ten_km, ma_code, ngay_bat_dau, ngay_ket_thuc, so_luong, da_su_dung, trang_thai, loai_khuyen_mai, hai_loai_toi_thieu, phan_tram_giam, gia_tri_giam_toi_da) VALUES 
('Mừng Ngày Khởi Nghiệp', 'CHOXANH2026', '2026-06-01 00:00:00', '2026-06-30 23:59:59', 100, 5, 1, 'phan_tram', 150000, 10.00, 50000.00),
('Giảm Thẳng Tiền Mặt', 'TIENMAT20', '2026-06-01 00:00:00', '2026-06-15 23:59:59', 50, 2, 1, 'tien_mat', 200000, NULL, 20000.00);


-- ==========================================
-- 17. BẢNG ĐƠN HÀNG
-- ==========================================
CREATE TABLE don_hang (
    madh INT AUTO_INCREMENT PRIMARY KEY,
    mand INT NOT NULL,
    makm INT,
    tien_giam DECIMAL(15,2),
    ten_nguoi_nhan VARCHAR(100),
    email_nguoi_nhan VARCHAR(120),
    sdt_nguoi_nhan VARCHAR(20),
    loai_don_hang ENUM('thuong','dat_truoc','dinh_ky'),
    tong_tien DECIMAL(15,2),
    tong_da_thanh_toan DECIMAL(15,2),
    trang_thai ENUM('cho_xac_nhan','dang_giao','hoan_thanh','huy'),
    trang_thai_thanh_toan ENUM('chua_thanh_toan','da_thanh_toan'),
    dia_chi_giao TEXT,
    ngay_dat DATETIME,
    ngay_giao DATETIME,

    CONSTRAINT fk_dh_nd
    FOREIGN KEY (mand) REFERENCES nguoi_dung(mand),

    CONSTRAINT fk_dh_km
    FOREIGN KEY (makm) REFERENCES khuyen_mai(makm)
);

INSERT INTO don_hang (mand, makm, tien_giam, ten_nguoi_nhan, email_nguoi_nhan, sdt_nguoi_nhan, loai_don_hang, tong_tien, tong_da_thanh_toan, trang_thai, trang_thai_thanh_toan, dia_chi_giao, ngay_dat, ngay_giao) VALUES 
(2, 1, 13500.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 121500.00, 121500.00, 'hoan_thanh', 'da_thanh_toan', '123 Đường 30/4, Ninh Kiều, Cần Thơ', '2026-06-04 09:00:00', '2026-06-04 14:00:00');


-- ==========================================
-- 18. BẢNG CHI TIẾT ĐƠN HÀNG
-- ==========================================
CREATE TABLE chi_tiet_don_hang (
    mactdh INT AUTO_INCREMENT PRIMARY KEY,
    madh INT NOT NULL,
    masp INT NOT NULL,
    so_luong INT,
    don_gia DECIMAL(12,2),
    thanh_tien DECIMAL(15,2),

    CONSTRAINT fk_ctdh_dh
    FOREIGN KEY (madh) REFERENCES don_hang(madh),

    CONSTRAINT fk_ctdh_sp
    FOREIGN KEY (masp) REFERENCES san_pham(masp)
);

INSERT INTO chi_tiet_don_hang (madh, masp, so_luong, don_gia, thanh_tien) VALUES 
(1, 1, 3, 45000.00, 135000.00);


-- ==========================================
-- 19. BẢNG THANH TOÁN
-- ==========================================
CREATE TABLE thanh_toan (
    matt INT AUTO_INCREMENT PRIMARY KEY,
    madh INT NOT NULL,
    so_tien DECIMAL(15,2),
    phuong_thuc ENUM('tien_mat','momo','zalopay','banking'),
    trang_thai ENUM('cho_thanh_toan','da_thanh_toan','that_bai'),
    ma_giao_dich VARCHAR(100),
    loai_thanh_toan INT,
    ngay_thanh_toan DATETIME,

    CONSTRAINT fk_tt_dh
    FOREIGN KEY (madh) REFERENCES don_hang(madh)
);

INSERT INTO thanh_toan (madh, so_tien, phuong_thuc, trang_thai, ma_giao_dich, loai_thanh_toan, ngay_thanh_toan) VALUES 
(1, 121500.00, 'momo', 'da_thanh_toan', 'MOMO_TXN_20260604_999', 1, '2026-06-04 09:02:00');