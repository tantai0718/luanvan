-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 14, 2026 at 08:33 AM
-- Server version: 8.4.7
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cho_nong_san`
--

-- --------------------------------------------------------

--
-- Table structure for table `banner`
--

DROP TABLE IF EXISTS `banner`;
CREATE TABLE IF NOT EXISTS `banner` (
  `mabn` int NOT NULL AUTO_INCREMENT,
  `mand` int NOT NULL,
  `hinh_anh` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thu_tu_hien_thi` int DEFAULT NULL,
  `trang_thai` tinyint(1) DEFAULT NULL,
  `ngay_tao` datetime DEFAULT NULL,
  PRIMARY KEY (`mabn`),
  KEY `fk_banner_nd` (`mand`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `banner`
--

INSERT INTO `banner` (`mabn`, `mand`, `hinh_anh`, `thu_tu_hien_thi`, `trang_thai`, `ngay_tao`) VALUES
(1, 1, 'banner_tet_2026.png', 1, 1, '2026-01-01 08:00:00'),
(2, 1, 'banner_weekend.png', 2, 1, '2026-05-28 09:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `chi_tiet_don_hang`
--

DROP TABLE IF EXISTS `chi_tiet_don_hang`;
CREATE TABLE IF NOT EXISTS `chi_tiet_don_hang` (
  `mactdh` int NOT NULL AUTO_INCREMENT,
  `madh` int NOT NULL,
  `masp` int NOT NULL,
  `so_luong` int DEFAULT NULL,
  `don_gia` decimal(12,2) DEFAULT NULL,
  `thanh_tien` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`mactdh`),
  KEY `fk_ctdh_dh` (`madh`),
  KEY `fk_ctdh_sp` (`masp`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chi_tiet_don_hang`
--

INSERT INTO `chi_tiet_don_hang` (`mactdh`, `madh`, `masp`, `so_luong`, `don_gia`, `thanh_tien`) VALUES
(1, 1, 1, 3, 45000.00, 135000.00),
(2, 2, 1, 3, 45000.00, 135000.00),
(3, 2, 2, 2, 35000.00, 70000.00),
(4, 3, 7, 1, 20000.00, 20000.00),
(5, 4, 7, 1, 20000.00, 20000.00),
(6, 5, 7, 2, 20000.00, 40000.00),
(7, 6, 6, 2, 50000.00, 100000.00),
(8, 7, 7, 2, 20000.00, 40000.00),
(9, 8, 7, 1, 20000.00, 20000.00),
(10, 9, 7, 1, 20000.00, 20000.00),
(11, 10, 7, 1, 20000.00, 20000.00),
(12, 11, 7, 1, 20000.00, 20000.00),
(13, 12, 7, 1, 20000.00, 20000.00),
(14, 13, 7, 1, 20000.00, 20000.00),
(15, 14, 7, 1, 20000.00, 20000.00),
(16, 15, 6, 1, 50000.00, 50000.00),
(17, 16, 5, 1, 30000.00, 30000.00),
(18, 17, 7, 1, 20000.00, 20000.00),
(19, 18, 7, 1, 20000.00, 20000.00),
(20, 19, 7, 1, 20000.00, 20000.00),
(21, 20, 7, 3, 20000.00, 60000.00),
(22, 21, 7, 4, 20000.00, 80000.00),
(23, 22, 7, 1, 20000.00, 20000.00),
(24, 23, 5, 5, 30000.00, 150000.00),
(25, 24, 7, 2, 20000.00, 40000.00),
(26, 24, 6, 1, 50000.00, 50000.00),
(27, 25, 7, 1, 20000.00, 20000.00),
(28, 25, 6, 1, 50000.00, 50000.00),
(29, 26, 7, 1, 20000.00, 20000.00),
(30, 27, 7, 3, 20000.00, 60000.00),
(31, 28, 7, 1, 20000.00, 20000.00),
(32, 28, 6, 2, 50000.00, 100000.00),
(33, 29, 7, 10, 20000.00, 200000.00),
(34, 30, 7, 1, 20000.00, 20000.00),
(35, 31, 7, 1, 20000.00, 20000.00),
(36, 32, 7, 2, 20000.00, 40000.00),
(37, 33, 7, 2, 20000.00, 40000.00),
(38, 34, 7, 1, 20000.00, 20000.00),
(39, 34, 6, 1, 50000.00, 50000.00);

-- --------------------------------------------------------

--
-- Table structure for table `chi_tiet_gio_hang`
--

DROP TABLE IF EXISTS `chi_tiet_gio_hang`;
CREATE TABLE IF NOT EXISTS `chi_tiet_gio_hang` (
  `mactgh` int NOT NULL AUTO_INCREMENT,
  `magh` int NOT NULL,
  `masp` int NOT NULL,
  `so_luong` int DEFAULT NULL,
  PRIMARY KEY (`mactgh`),
  KEY `fk_ctgh_gh` (`magh`),
  KEY `fk_ctgh_sp` (`masp`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dang_ky_san_pham`
--

DROP TABLE IF EXISTS `dang_ky_san_pham`;
CREATE TABLE IF NOT EXISTS `dang_ky_san_pham` (
  `madk` int NOT NULL AUTO_INCREMENT,
  `mand` int NOT NULL,
  `masp` int NOT NULL,
  `loai_dang_ky` enum('dat_truoc','dinh_ky') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_luong` int DEFAULT NULL,
  `gia_du_kien` decimal(12,2) DEFAULT NULL,
  `chu_ky` enum('hang_tuan','hai_tuan','hang_thang') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_chi_giao` text COLLATE utf8mb4_unicode_ci,
  `phuong_thuc_tt` enum('tien_mat','vnpay') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tien_mat',
  `ngay_bat_dau` datetime DEFAULT NULL,
  `ngay_giao_tiep_theo` datetime DEFAULT NULL,
  `ngay_ket_thuc` datetime DEFAULT NULL,
  `so_lan_giao` int DEFAULT NULL,
  `so_lan_da_giao` int DEFAULT NULL,
  `trang_thai` enum('dang_hoat_dong','tam_dung','hoan_thanh','da_huy') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dang_hoat_dong',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`madk`),
  KEY `fk_dksp_nd` (`mand`),
  KEY `fk_dksp_sp` (`masp`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dang_ky_san_pham`
--

INSERT INTO `dang_ky_san_pham` (`madk`, `mand`, `masp`, `loai_dang_ky`, `so_luong`, `gia_du_kien`, `chu_ky`, `dia_chi_giao`, `phuong_thuc_tt`, `ngay_bat_dau`, `ngay_giao_tiep_theo`, `ngay_ket_thuc`, `so_lan_giao`, `so_lan_da_giao`, `trang_thai`, `ghi_chu`) VALUES
(1, 2, 3, 'dinh_ky', 10, 30000.00, 'hang_thang', '123 Đường 30/4, Ninh Kiều, Cần Thơ', 'tien_mat', '2026-06-01 00:00:00', '2026-07-05 00:00:00', '2026-07-08 22:29:41', 5, 1, 'da_huy', 'Giao gạo vào ngày 5 hàng tháng');

-- --------------------------------------------------------

--
-- Table structure for table `danh_gia`
--

DROP TABLE IF EXISTS `danh_gia`;
CREATE TABLE IF NOT EXISTS `danh_gia` (
  `madg` int NOT NULL AUTO_INCREMENT,
  `mand` int NOT NULL,
  `masp` int NOT NULL,
  `so_sao` int DEFAULT NULL,
  `binh_luan` text COLLATE utf8mb4_unicode_ci,
  `ngay_danh_gia` datetime DEFAULT NULL,
  PRIMARY KEY (`madg`),
  KEY `fk_dg_nd` (`mand`),
  KEY `fk_dg_sp` (`masp`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `danh_gia`
--

INSERT INTO `danh_gia` (`madg`, `mand`, `masp`, `so_sao`, `binh_luan`, `ngay_danh_gia`) VALUES
(1, 2, 1, 5, 'Xoài rất ngọt, đóng gói kỹ, giao hàng nhanh mát.', '2026-06-04 16:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `danh_muc`
--

DROP TABLE IF EXISTS `danh_muc`;
CREATE TABLE IF NOT EXISTS `danh_muc` (
  `madm` int NOT NULL AUTO_INCREMENT,
  `ten_danh_muc` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`madm`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `danh_muc`
--

INSERT INTO `danh_muc` (`madm`, `ten_danh_muc`, `mo_ta`, `trang_thai`) VALUES
(1, 'Trái Cây', 'Các loại trái cây tươi ngon bốn mùa', 1),
(2, 'Rau Củ Quả', 'Rau củ hữu cơ, VietGAP an toàn sinh học', 1),
(3, 'Gạo & Ngũ Cốc', 'Gạo đặc sản và các loại hạt dinh dưỡng', 1),
(4, 'demo', '', 1);

-- --------------------------------------------------------

--
-- Table structure for table `don_hang`
--

DROP TABLE IF EXISTS `don_hang`;
CREATE TABLE IF NOT EXISTS `don_hang` (
  `madh` int NOT NULL AUTO_INCREMENT,
  `mand` int NOT NULL,
  `makm` int DEFAULT NULL,
  `tien_giam` decimal(15,2) DEFAULT NULL,
  `ten_nguoi_nhan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_nguoi_nhan` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sdt_nguoi_nhan` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loai_don_hang` enum('thuong','dat_truoc','dinh_ky') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tong_tien` decimal(15,2) DEFAULT NULL,
  `tong_da_thanh_toan` decimal(15,2) DEFAULT NULL,
  `trang_thai` enum('cho_xac_nhan','da_xac_nhan','dang_giao','da_giao','da_huy') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai_thanh_toan` enum('chua_thanh_toan','da_thanh_toan') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_chi_giao` text COLLATE utf8mb4_unicode_ci,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_dat` datetime DEFAULT NULL,
  `ngay_giao_du_kien` datetime DEFAULT NULL,
  `ngay_giao_thuc_te` datetime DEFAULT NULL,
  PRIMARY KEY (`madh`),
  KEY `fk_dh_nd` (`mand`),
  KEY `fk_dh_km` (`makm`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `don_hang`
--

INSERT INTO `don_hang` (`madh`, `mand`, `makm`, `tien_giam`, `ten_nguoi_nhan`, `email_nguoi_nhan`, `sdt_nguoi_nhan`, `loai_don_hang`, `tong_tien`, `tong_da_thanh_toan`, `trang_thai`, `trang_thai_thanh_toan`, `dia_chi_giao`, `ghi_chu`, `ngay_dat`, `ngay_giao_du_kien`, `ngay_giao_thuc_te`) VALUES
(1, 2, 1, 13500.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 121500.00, 121500.00, 'da_giao', 'da_thanh_toan', '123 Đường 30/4, Ninh Kiều, Cần Thơ', NULL, '2026-06-04 09:00:00', '2026-06-04 14:00:00', '2026-06-04 14:00:00'),
(2, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 235000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', '180 cao lỗ ', NULL, '2026-07-06 07:52:10', '2026-07-08 07:52:10', NULL),
(3, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'da_huy', 'chua_thanh_toan', '18 cao lỗ\n', NULL, '2026-07-06 07:52:59', '2026-07-08 07:52:59', NULL),
(4, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'da_huy', 'chua_thanh_toan', '180 cao lỗ', NULL, '2026-07-06 07:53:24', '2026-07-08 07:53:24', NULL),
(5, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 70000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', '0000', NULL, '2026-07-06 13:20:01', '2026-07-08 13:20:01', NULL),
(6, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 130000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'qsd', NULL, '2026-07-06 15:34:49', '2026-07-08 15:34:49', NULL),
(7, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 70000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'ádfdg', NULL, '2026-07-06 17:03:39', '2026-07-08 17:03:39', NULL),
(8, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'adsc', NULL, '2026-07-06 17:04:24', '2026-07-08 17:04:24', NULL),
(9, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'xsadfhj', NULL, '2026-07-06 17:21:41', '2026-07-08 17:21:41', NULL),
(10, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', '2qwef', NULL, '2026-07-06 23:01:27', '2026-07-08 23:01:27', NULL),
(11, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'dsvd ', NULL, '2026-07-06 23:01:40', '2026-07-08 23:01:40', NULL),
(12, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'ádvasdvc', NULL, '2026-07-06 23:02:31', '2026-07-08 23:02:31', NULL),
(13, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'ádvcdsd', NULL, '2026-07-06 23:03:01', '2026-07-08 23:03:01', NULL),
(14, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'ádvasd', NULL, '2026-07-08 22:29:16', '2026-07-10 22:29:16', NULL),
(15, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 80000.00, 0.00, 'da_xac_nhan', 'chua_thanh_toan', 'sadfas', NULL, '2026-07-08 22:30:09', '2026-07-10 22:30:09', NULL),
(16, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 60000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'ư3ertui', NULL, '2026-07-08 23:10:47', '2026-07-10 23:10:47', NULL),
(17, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'da_giao', 'da_thanh_toan', 'sđfgh', NULL, '2026-07-08 23:13:46', '2026-07-10 23:13:46', '2026-07-08 23:17:18'),
(18, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'adsfb', NULL, '2026-07-08 23:18:27', '2026-07-10 23:18:27', NULL),
(19, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'sadf', NULL, '2026-07-08 23:18:42', '2026-07-10 23:18:42', NULL),
(20, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 90000.00, 0.00, 'da_huy', 'chua_thanh_toan', 'ádfghj', NULL, '2026-07-08 23:21:11', '2026-07-10 23:21:11', NULL),
(21, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 110000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'ẻtyu', NULL, '2026-07-08 23:21:39', '2026-07-10 23:21:39', NULL),
(22, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'sdfgh', NULL, '2026-07-08 23:22:34', '2026-07-10 23:22:34', NULL),
(23, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 180000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', '180aaa', NULL, '2026-07-08 23:27:08', '2026-07-10 23:27:08', NULL),
(24, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 120000.00, 120000.00, 'dang_giao', 'da_thanh_toan', 'sdfghjkuyrtewq', NULL, '2026-07-08 23:28:04', '2026-07-10 23:28:04', NULL),
(25, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 100000.00, 100000.00, 'da_huy', 'da_thanh_toan', 'qưegm', NULL, '2026-07-08 23:48:32', '2026-07-10 23:48:32', NULL),
(26, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 50000.00, 'da_xac_nhan', 'da_thanh_toan', 'ádv', NULL, '2026-07-08 23:54:51', '2026-07-10 23:54:51', NULL),
(27, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 90000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'asdgfdhjhklj;', NULL, '2026-07-10 10:49:32', '2026-07-12 10:49:32', NULL),
(28, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 150000.00, 150000.00, 'da_xac_nhan', 'da_thanh_toan', 'asdgfhjk', NULL, '2026-07-10 10:51:57', '2026-07-12 10:51:57', NULL),
(29, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 230000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'sdafshjkl;\'lkjfdsa', NULL, '2026-07-10 15:49:16', '2026-07-12 15:49:16', NULL),
(30, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'ádasdsfd', NULL, '2026-07-11 19:57:35', '2026-07-13 19:57:35', NULL),
(31, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 50000.00, 50000.00, 'cho_xac_nhan', 'da_thanh_toan', 'fdsa', NULL, '2026-07-11 19:59:34', '2026-07-13 19:59:34', NULL),
(32, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 70000.00, 70000.00, 'cho_xac_nhan', 'da_thanh_toan', 'asddhg', NULL, '2026-07-12 11:56:46', '2026-07-14 11:56:46', NULL),
(33, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 70000.00, 0.00, 'cho_xac_nhan', 'chua_thanh_toan', 'sfgdn', NULL, '2026-07-13 07:18:32', '2026-07-15 07:18:32', NULL),
(34, 2, NULL, 0.00, 'Trần Thị Mua', 'thimua.user@gmail.com', '0918765432', 'thuong', 100000.00, 100000.00, 'da_xac_nhan', 'da_thanh_toan', 'adsfn', NULL, '2026-07-13 08:03:15', '2026-07-15 08:03:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `file_hinh_anh`
--

DROP TABLE IF EXISTS `file_hinh_anh`;
CREATE TABLE IF NOT EXISTS `file_hinh_anh` (
  `maffha` int NOT NULL AUTO_INCREMENT,
  `matnc` int NOT NULL,
  `ten_file` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duong_dan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loai_file` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kich_thuoc` float DEFAULT NULL,
  `dinh_dang` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` datetime DEFAULT NULL,
  PRIMARY KEY (`maffha`),
  KEY `fk_fha_tnc` (`matnc`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `file_hinh_anh`
--

INSERT INTO `file_hinh_anh` (`maffha`, `matnc`, `ten_file`, `duong_dan`, `loai_file`, `kich_thuoc`, `dinh_dang`, `ngay_tao`) VALUES
(1, 1, 'anh_mau_trai_cay.png', 'uploads/chat/anh_mau.png', 'image/png', 1024.5, 'png', '2026-06-04 15:31:00');

-- --------------------------------------------------------

--
-- Table structure for table `gio_hang`
--

DROP TABLE IF EXISTS `gio_hang`;
CREATE TABLE IF NOT EXISTS `gio_hang` (
  `magh` int NOT NULL AUTO_INCREMENT,
  `mand` int NOT NULL,
  `ngay_tao` datetime DEFAULT NULL,
  PRIMARY KEY (`magh`),
  KEY `fk_gh_nd` (`mand`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gio_hang`
--

INSERT INTO `gio_hang` (`magh`, `mand`, `ngay_tao`) VALUES
(1, 2, '2026-06-01 11:00:00'),
(2, 3, '2026-06-02 14:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `hinh_anh_video`
--

DROP TABLE IF EXISTS `hinh_anh_video`;
CREATE TABLE IF NOT EXISTS `hinh_anh_video` (
  `mahav` int NOT NULL AUTO_INCREMENT,
  `masp` int NOT NULL,
  `duong_dan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loai` enum('hinh_anh','video') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thumbnail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thu_tu` int DEFAULT NULL,
  `la_chinh` tinyint(1) DEFAULT NULL,
  `ngay_tao` datetime DEFAULT NULL,
  PRIMARY KEY (`mahav`),
  KEY `fk_hav_sp` (`masp`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hinh_anh_video`
--

INSERT INTO `hinh_anh_video` (`mahav`, `masp`, `duong_dan`, `loai`, `thumbnail`, `thu_tu`, `la_chinh`, `ngay_tao`) VALUES
(1, 1, 'products/xoai_chu_1.png', 'hinh_anh', 'products/xoai_chu_1_thumb.png', 1, 1, '2026-05-20 07:05:00'),
(2, 1, 'products/clip_thu_hoach_xoai.mp4', 'video', 'products/video_thumb.png', 2, 0, '2026-05-20 07:06:00'),
(4, 5, 'products/1783080489348_0.jpg', 'hinh_anh', NULL, 0, 1, '2026-07-03 19:08:09'),
(5, 6, 'products/1783080507776_0.jpg', 'hinh_anh', NULL, 0, 1, '2026-07-03 19:08:27'),
(6, 7, 'products/1783080596169_0.jpg', 'hinh_anh', NULL, 0, 1, '2026-07-03 19:09:56'),
(7, 7, 'products/1783080596176_1.mp4', 'video', NULL, 1, 0, '2026-07-03 19:09:56'),
(12, 10, 'products/1783912736029_0.jpg', 'hinh_anh', NULL, 0, 1, '2026-07-13 10:18:56');

-- --------------------------------------------------------

--
-- Table structure for table `khuyen_mai`
--

DROP TABLE IF EXISTS `khuyen_mai`;
CREATE TABLE IF NOT EXISTS `khuyen_mai` (
  `makm` int NOT NULL AUTO_INCREMENT,
  `ten_km` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_bat_dau` datetime DEFAULT NULL,
  `ngay_ket_thuc` datetime DEFAULT NULL,
  `so_luong` int DEFAULT NULL,
  `da_su_dung` int DEFAULT NULL,
  `trang_thai` tinyint(1) DEFAULT NULL,
  `loai_khuyen_mai` enum('phan_tram','tien_mat') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_luong_toi_thieu` int DEFAULT NULL,
  `phan_tram_giam` decimal(5,2) DEFAULT NULL,
  `gia_tri_giam_toi_da` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`makm`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `khuyen_mai`
--

INSERT INTO `khuyen_mai` (`makm`, `ten_km`, `ma_code`, `ngay_bat_dau`, `ngay_ket_thuc`, `so_luong`, `da_su_dung`, `trang_thai`, `loai_khuyen_mai`, `so_luong_toi_thieu`, `phan_tram_giam`, `gia_tri_giam_toi_da`) VALUES
(1, 'Mừng Ngày Khởi Nghiệp', 'CHOXANH2026', '2026-06-01 00:00:00', '2026-06-30 23:59:59', 100, 5, 1, 'phan_tram', 150000, 10.00, 50000.00),
(2, 'Giảm Thẳng Tiền Mặt', 'TIENMAT20', '2026-06-01 00:00:00', '2026-06-15 23:59:59', 50, 2, 1, 'tien_mat', 200000, NULL, 20000.00);

-- --------------------------------------------------------

--
-- Table structure for table `mua_vu`
--

DROP TABLE IF EXISTS `mua_vu`;
CREATE TABLE IF NOT EXISTS `mua_vu` (
  `mamv` int NOT NULL AUTO_INCREMENT,
  `ten_mua` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thang_bat_dau` tinyint DEFAULT NULL,
  `thang_ket_thuc` tinyint DEFAULT NULL,
  `qua_nam` tinyint(1) DEFAULT '0',
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`mamv`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mua_vu`
--

INSERT INTO `mua_vu` (`mamv`, `ten_mua`, `thang_bat_dau`, `thang_ket_thuc`, `qua_nam`, `mo_ta`, `trang_thai`) VALUES
(1, 'Mùa Thu Hoạch Rộ Xoài Cát', 4, 7, 0, 'Giai đoạn xoài chín ngọt và có sản lượng lớn nhất năm', 1),
(2, 'Mùa Rau Củ Đà Lạt', 11, 3, 1, 'Mùa rau củ mát lạnh chất lượng cao từ Đà Lạt', 1);

-- --------------------------------------------------------

--
-- Table structure for table `nguoi_dung`
--

DROP TABLE IF EXISTS `nguoi_dung`;
CREATE TABLE IF NOT EXISTS `nguoi_dung` (
  `mand` int NOT NULL AUTO_INCREMENT,
  `mavt` int NOT NULL,
  `ho_ten` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mat_khau` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sdt` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`mand`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_nd_vt` (`mavt`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nguoi_dung`
--

INSERT INTO `nguoi_dung` (`mand`, `mavt`, `ho_ten`, `email`, `mat_khau`, `sdt`, `trang_thai`) VALUES
(1, 1, 'Trịnh Minh Giàu', 'minhgiau.admin@gmail.com', '$2a$10$0h4ts4JrhflI6mPKpJWaLO7dmCAVvVJJSNg4V7B7c9EkT/2qKhTDK', '0901234567', 1),
(2, 2, 'Trần Thị Mua', 'thimua.user@gmail.com', '$2a$10$l.km3Wlix89bWH.hB0czdeTs36MXRlc/rus/Js5Mu4pRh8x/8NB8W', '0918765432', 1),
(3, 2, 'Lê Văn Khách', 'vankhach.user@gmail.com', '123456', '0987654321', 1);

-- --------------------------------------------------------

--
-- Table structure for table `phien_chat`
--

DROP TABLE IF EXISTS `phien_chat`;
CREATE TABLE IF NOT EXISTS `phien_chat` (
  `mapc` int NOT NULL AUTO_INCREMENT,
  `mand` int NOT NULL,
  `session_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_bat_dau` datetime DEFAULT NULL,
  `ngay_ket_thuc` datetime DEFAULT NULL,
  `trang_thai` enum('dang_hoat_dong','da_dong') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`mapc`),
  KEY `fk_pc_nd` (`mand`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `phien_chat`
--

INSERT INTO `phien_chat` (`mapc`, `mand`, `session_token`, `ngay_bat_dau`, `ngay_ket_thuc`, `trang_thai`) VALUES
(1, 2, 'token_abc123xyz', '2026-06-04 15:30:00', NULL, 'dang_hoat_dong'),
(2, 3, 'token_def456uvw', '2026-06-03 09:00:00', '2026-06-03 09:45:00', 'da_dong'),
(3, 1, '283558e9b4fe5e4c5b7f3190a4c04d9d', '2026-07-13 08:05:39', NULL, 'dang_hoat_dong');

-- --------------------------------------------------------

--
-- Table structure for table `san_pham`
--

DROP TABLE IF EXISTS `san_pham`;
CREATE TABLE IF NOT EXISTS `san_pham` (
  `masp` int NOT NULL AUTO_INCREMENT,
  `madm` int NOT NULL,
  `ten_san_pham` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gia_ban` decimal(12,2) DEFAULT NULL,
  `so_luong_ton` int DEFAULT NULL,
  `don_vi` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `khu_vuc` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `trang_thai` tinyint(1) DEFAULT NULL,
  `ngay_tao` datetime DEFAULT NULL,
  PRIMARY KEY (`masp`),
  KEY `fk_sp_dm` (`madm`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `san_pham`
--

INSERT INTO `san_pham` (`masp`, `madm`, `ten_san_pham`, `gia_ban`, `so_luong_ton`, `don_vi`, `khu_vuc`, `mo_ta`, `trang_thai`, `ngay_tao`) VALUES
(1, 1, 'Xoài Cát Chu Lộc Phát', 45000.00, 497, 'Kg', 'Đồng Tháp', NULL, 1, '2026-05-20 07:00:00'),
(2, 2, 'Cà Chua Bi Hữu Cơ', 35000.00, 198, 'Kg', 'Đà Lạt', NULL, 1, '2026-05-22 08:30:00'),
(3, 3, 'Gạo ST25 Chuẩn Sạch', 32000.00, 1000, 'Kg', 'Sóc Trăng', NULL, 1, '2026-05-25 09:00:00'),
(5, 2, 'xà lách', 30000.00, 194, 'kg', '', NULL, 1, '2026-07-03 19:08:09'),
(6, 1, 'xoài', 50000.00, 192, 'kg', '', NULL, 1, '2026-07-03 19:08:27'),
(7, 3, 'cà chua', 20000.00, 156, 'kg', '', 'ngon', 1, '2026-07-03 19:09:56'),
(10, 4, 'demo 1', 444444.00, 44, 'kg', '', 'sgdhfj', 1, '2026-07-13 10:18:56');

-- --------------------------------------------------------

--
-- Table structure for table `san_pham_mua_vu`
--

DROP TABLE IF EXISTS `san_pham_mua_vu`;
CREATE TABLE IF NOT EXISTS `san_pham_mua_vu` (
  `maspmv` int NOT NULL AUTO_INCREMENT,
  `masp` int NOT NULL,
  `mamv` int NOT NULL,
  `so_luong_du_kien` int DEFAULT NULL,
  `so_luong_thuc_te` int DEFAULT NULL,
  `gia_du_kien` decimal(12,2) DEFAULT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`maspmv`),
  UNIQUE KEY `uq_sp_mv` (`masp`,`mamv`),
  KEY `fk_spmv_mv` (`mamv`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `san_pham_mua_vu`
--

INSERT INTO `san_pham_mua_vu` (`maspmv`, `masp`, `mamv`, `so_luong_du_kien`, `so_luong_thuc_te`, `gia_du_kien`, `ghi_chu`) VALUES
(1, 1, 1, 2000, 1850, 43000.00, 'Xoài cát chu vào mùa rộ, giá giảm nhẹ so với trái vụ'),
(2, 2, 2, 500, NULL, 33000.00, 'Cà chua Đà Lạt mùa đông, chất lượng tốt nhất');

-- --------------------------------------------------------

--
-- Table structure for table `thanh_toan`
--

DROP TABLE IF EXISTS `thanh_toan`;
CREATE TABLE IF NOT EXISTS `thanh_toan` (
  `matt` int NOT NULL AUTO_INCREMENT,
  `madh` int NOT NULL,
  `so_tien` decimal(15,2) DEFAULT NULL,
  `phuong_thuc` enum('tien_mat','momo','zalopay','banking') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` enum('cho_thanh_toan','da_thanh_toan','that_bai') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_giao_dich` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hinh_anh_chuyen_khoan` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loai_thanh_toan` int DEFAULT NULL,
  `ngay_thanh_toan` datetime DEFAULT NULL,
  PRIMARY KEY (`matt`),
  KEY `fk_tt_dh` (`madh`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `thanh_toan`
--

INSERT INTO `thanh_toan` (`matt`, `madh`, `so_tien`, `phuong_thuc`, `trang_thai`, `ma_giao_dich`, `hinh_anh_chuyen_khoan`, `loai_thanh_toan`, `ngay_thanh_toan`) VALUES
(1, 1, 121500.00, 'momo', 'da_thanh_toan', 'MOMO_TXN_20260604_999', NULL, 1, '2026-06-04 09:02:00'),
(2, 2, 235000.00, '', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-06 07:52:10'),
(3, 3, 50000.00, 'tien_mat', 'that_bai', NULL, NULL, NULL, '2026-07-06 07:52:59'),
(4, 4, 50000.00, 'banking', 'that_bai', NULL, NULL, NULL, '2026-07-06 07:53:24'),
(5, 5, 70000.00, '', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-06 13:20:01'),
(6, 6, 130000.00, '', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-06 15:34:49'),
(7, 7, 70000.00, '', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-06 17:03:39'),
(8, 8, 50000.00, '', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-06 17:04:24'),
(9, 9, 50000.00, '', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-06 17:21:41'),
(10, 10, 50000.00, 'tien_mat', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-06 23:01:27'),
(11, 11, 50000.00, 'tien_mat', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-06 23:01:40'),
(12, 12, 50000.00, 'tien_mat', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-06 23:02:31'),
(13, 13, 50000.00, 'tien_mat', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-06 23:03:01'),
(14, 14, 50000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-08 22:29:16'),
(15, 15, 80000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-08 22:30:09'),
(16, 16, 60000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-08 23:10:47'),
(17, 17, 50000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-08 23:13:46'),
(18, 18, 50000.00, 'tien_mat', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-08 23:18:27'),
(19, 19, 50000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-08 23:18:42'),
(20, 20, 90000.00, 'tien_mat', 'that_bai', NULL, NULL, NULL, '2026-07-08 23:21:11'),
(21, 21, 110000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-08 23:21:39'),
(22, 22, 50000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-08 23:22:34'),
(23, 23, 180000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-08 23:27:08'),
(24, 24, 120000.00, 'banking', '', NULL, NULL, NULL, '2026-07-08 23:39:02'),
(25, 25, 100000.00, 'banking', '', NULL, NULL, NULL, '2026-07-08 23:49:06'),
(26, 26, 50000.00, 'banking', '', NULL, NULL, NULL, '2026-07-08 23:55:18'),
(27, 27, 90000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-10 10:49:32'),
(28, 28, 150000.00, 'banking', '', NULL, NULL, NULL, '2026-07-10 10:52:27'),
(29, 29, 230000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-10 15:49:16'),
(30, 30, 50000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-11 19:57:35'),
(31, 31, 50000.00, 'banking', '', NULL, NULL, NULL, '2026-07-11 20:49:53'),
(32, 32, 70000.00, 'banking', '', NULL, NULL, NULL, '2026-07-12 11:57:54'),
(33, 33, 70000.00, 'banking', 'cho_thanh_toan', NULL, NULL, NULL, '2026-07-13 07:18:32'),
(34, 34, 100000.00, 'banking', 'da_thanh_toan', NULL, NULL, NULL, '2026-07-13 08:03:15');

-- --------------------------------------------------------

--
-- Table structure for table `thong_bao`
--

DROP TABLE IF EXISTS `thong_bao`;
CREATE TABLE IF NOT EXISTS `thong_bao` (
  `matb` int NOT NULL AUTO_INCREMENT,
  `mand` int NOT NULL,
  `tieu_de` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noi_dung` text COLLATE utf8mb4_unicode_ci,
  `loai` enum('he_thong','khuyen_mai','don_hang') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `da_doc` tinyint(1) DEFAULT NULL,
  `ngay_tao` datetime DEFAULT NULL,
  PRIMARY KEY (`matb`),
  KEY `fk_tb_nd` (`mand`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `thong_bao`
--

INSERT INTO `thong_bao` (`matb`, `mand`, `tieu_de`, `noi_dung`, `loai`, `da_doc`, `ngay_tao`) VALUES
(1, 2, 'Đơn hàng đã đặt thành công', 'Đơn hàng #DH1001 của bạn đã được tiếp nhận.', 'don_hang', 0, '2026-06-04 10:00:00'),
(2, 1, 'Báo cáo hệ thống định kỳ', 'Hệ thống đã tự động tối ưu hóa tài nguyên tuần này.', 'he_thong', 1, '2026-06-03 14:20:00');

-- --------------------------------------------------------

--
-- Table structure for table `tin_nhan_chat`
--

DROP TABLE IF EXISTS `tin_nhan_chat`;
CREATE TABLE IF NOT EXISTS `tin_nhan_chat` (
  `matnc` int NOT NULL AUTO_INCREMENT,
  `mapc` int NOT NULL,
  `vai_tro` enum('user','bot','admin') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noi_dung` text COLLATE utf8mb4_unicode_ci,
  `loai_phien_only` json DEFAULT NULL,
  `loai_gui_y` enum('san_pham','ho_tro','khuyen_mai') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thoi_gian` datetime DEFAULT NULL,
  PRIMARY KEY (`matnc`),
  KEY `fk_tnc_pc` (`mapc`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tin_nhan_chat`
--

INSERT INTO `tin_nhan_chat` (`matnc`, `mapc`, `vai_tro`, `noi_dung`, `loai_phien_only`, `loai_gui_y`, `thoi_gian`) VALUES
(1, 1, 'user', 'Tôi muốn tìm mua trái cây miền Tây', '{}', 'san_pham', '2026-06-04 15:31:00'),
(2, 1, 'bot', 'Hệ thống gợi ý cho bạn một số sản phẩm nổi bật:', '{\"suggested_ids\": [1]}', 'san_pham', '2026-06-04 15:31:05'),
(3, 3, 'user', 'xoài', NULL, NULL, '2026-07-13 08:05:43'),
(4, 3, 'bot', 'Dạ bên em có Xoài Cát Chu Lộc Phát giá 43.000đ/Kg và xoài tươi ngon giá 50.000đ/kg cực kỳ ngọt thơm, mời bạn lựa chọn nhé! 🥭', '{\"is_season\": false, \"suggested_ids\": [1, 6]}', 'san_pham', '2026-07-13 08:06:00');

-- --------------------------------------------------------

--
-- Table structure for table `vai_tro`
--

DROP TABLE IF EXISTS `vai_tro`;
CREATE TABLE IF NOT EXISTS `vai_tro` (
  `mavt` int NOT NULL AUTO_INCREMENT,
  `ten_vai_tro` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`mavt`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vai_tro`
--

INSERT INTO `vai_tro` (`mavt`, `ten_vai_tro`, `mo_ta`, `trang_thai`) VALUES
(1, 'Admin', 'Quản trị viên toàn quyền hệ thống', 1),
(2, 'User', 'Người dùng/Khách hàng tham gia sàn', 1);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `banner`
--
ALTER TABLE `banner`
  ADD CONSTRAINT `fk_banner_nd` FOREIGN KEY (`mand`) REFERENCES `nguoi_dung` (`mand`);

--
-- Constraints for table `chi_tiet_don_hang`
--
ALTER TABLE `chi_tiet_don_hang`
  ADD CONSTRAINT `fk_ctdh_dh` FOREIGN KEY (`madh`) REFERENCES `don_hang` (`madh`),
  ADD CONSTRAINT `fk_ctdh_sp` FOREIGN KEY (`masp`) REFERENCES `san_pham` (`masp`);

--
-- Constraints for table `chi_tiet_gio_hang`
--
ALTER TABLE `chi_tiet_gio_hang`
  ADD CONSTRAINT `fk_ctgh_gh` FOREIGN KEY (`magh`) REFERENCES `gio_hang` (`magh`),
  ADD CONSTRAINT `fk_ctgh_sp` FOREIGN KEY (`masp`) REFERENCES `san_pham` (`masp`);

--
-- Constraints for table `dang_ky_san_pham`
--
ALTER TABLE `dang_ky_san_pham`
  ADD CONSTRAINT `fk_dksp_nd` FOREIGN KEY (`mand`) REFERENCES `nguoi_dung` (`mand`),
  ADD CONSTRAINT `fk_dksp_sp` FOREIGN KEY (`masp`) REFERENCES `san_pham` (`masp`);

--
-- Constraints for table `danh_gia`
--
ALTER TABLE `danh_gia`
  ADD CONSTRAINT `fk_dg_nd` FOREIGN KEY (`mand`) REFERENCES `nguoi_dung` (`mand`),
  ADD CONSTRAINT `fk_dg_sp` FOREIGN KEY (`masp`) REFERENCES `san_pham` (`masp`);

--
-- Constraints for table `don_hang`
--
ALTER TABLE `don_hang`
  ADD CONSTRAINT `fk_dh_km` FOREIGN KEY (`makm`) REFERENCES `khuyen_mai` (`makm`),
  ADD CONSTRAINT `fk_dh_nd` FOREIGN KEY (`mand`) REFERENCES `nguoi_dung` (`mand`);

--
-- Constraints for table `file_hinh_anh`
--
ALTER TABLE `file_hinh_anh`
  ADD CONSTRAINT `fk_fha_tnc` FOREIGN KEY (`matnc`) REFERENCES `tin_nhan_chat` (`matnc`);

--
-- Constraints for table `gio_hang`
--
ALTER TABLE `gio_hang`
  ADD CONSTRAINT `fk_gh_nd` FOREIGN KEY (`mand`) REFERENCES `nguoi_dung` (`mand`);

--
-- Constraints for table `hinh_anh_video`
--
ALTER TABLE `hinh_anh_video`
  ADD CONSTRAINT `fk_hav_sp` FOREIGN KEY (`masp`) REFERENCES `san_pham` (`masp`);

--
-- Constraints for table `nguoi_dung`
--
ALTER TABLE `nguoi_dung`
  ADD CONSTRAINT `fk_nd_vt` FOREIGN KEY (`mavt`) REFERENCES `vai_tro` (`mavt`);

--
-- Constraints for table `phien_chat`
--
ALTER TABLE `phien_chat`
  ADD CONSTRAINT `fk_pc_nd` FOREIGN KEY (`mand`) REFERENCES `nguoi_dung` (`mand`);

--
-- Constraints for table `san_pham`
--
ALTER TABLE `san_pham`
  ADD CONSTRAINT `fk_sp_dm` FOREIGN KEY (`madm`) REFERENCES `danh_muc` (`madm`);

--
-- Constraints for table `san_pham_mua_vu`
--
ALTER TABLE `san_pham_mua_vu`
  ADD CONSTRAINT `fk_spmv_mv` FOREIGN KEY (`mamv`) REFERENCES `mua_vu` (`mamv`),
  ADD CONSTRAINT `fk_spmv_sp` FOREIGN KEY (`masp`) REFERENCES `san_pham` (`masp`);

--
-- Constraints for table `thanh_toan`
--
ALTER TABLE `thanh_toan`
  ADD CONSTRAINT `fk_tt_dh` FOREIGN KEY (`madh`) REFERENCES `don_hang` (`madh`);

--
-- Constraints for table `thong_bao`
--
ALTER TABLE `thong_bao`
  ADD CONSTRAINT `fk_tb_nd` FOREIGN KEY (`mand`) REFERENCES `nguoi_dung` (`mand`);

--
-- Constraints for table `tin_nhan_chat`
--
ALTER TABLE `tin_nhan_chat`
  ADD CONSTRAINT `fk_tnc_pc` FOREIGN KEY (`mapc`) REFERENCES `phien_chat` (`mapc`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
