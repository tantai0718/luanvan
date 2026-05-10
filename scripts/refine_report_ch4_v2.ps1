$ErrorActionPreference = 'Stop'

$sourceDoc = 'D:\thuctap\chonongsan\cho_nong_san_FINAL\Bao_cao_website_cho_nong_san.docx'
$targetDoc = 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\Bao_cao_website_cho_nong_san_chuong4_chi_tiet_v2.docx'
$imageDir = 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\bao_cao_assets\images'
$openXmlDll = 'C:\Program Files\Windows Defender Advanced Threat Protection\Classification\Dprt\DocumentFormat.OpenXml.dll'

Copy-Item $sourceDoc $targetDoc -Force

$code = @'
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using A = DocumentFormat.OpenXml.Drawing;
using DW = DocumentFormat.OpenXml.Drawing.Wordprocessing;
using PIC = DocumentFormat.OpenXml.Drawing.Pictures;

public static class ReportChapter4BuilderV2
{
    public static void Run(string path, string imageDir)
    {
        using (var doc = WordprocessingDocument.Open(path, true))
        {
            var body = doc.MainDocumentPart.Document.Body;

            SetParagraphByStartsWith(body, "Phân tích thành phần dữ liệu", "4.1 Phân tích thành phần dữ liệu");
            SetParagraphByStartsWith(body, "Sơ đồ ER / sơ đồ lớp", "4.1.1 Sơ đồ ER của hệ thống");
            SetParagraphByStartsWith(body, "Hình 41.", "Hình 41. Sơ đồ ER của hệ thống chợ nông sản.");
            SetParagraphByStartsWith(body, "Mô tả các loại thực thể/lớp", "4.2 Mô tả chi tiết các thực thể");
            SetParagraphByStartsWith(body, "Mô tả các ràng buộc dữ liệu", "4.3 Mô tả các ràng buộc dữ liệu");
            SetParagraphByStartsWith(body, "Thiết kế và triển khai hệ thống", "5. Thiết kế và triển khai hệ thống");

            InsertImageBeforeCaption(doc, body, "Hình 31.", Path.Combine(imageDir, "usecase_nguoi_mua.png"), 6200000L, 3600000L);
            InsertImageBeforeCaption(doc, body, "Hình 32.", Path.Combine(imageDir, "usecase_quan_tri_nong_dan.png"), 6200000L, 3600000L);
            InsertImageBeforeCaption(doc, body, "Hình 41.", Path.Combine(imageDir, "erd_cho_nong_san.png"), 6200000L, 3900000L);

            ReplaceBetween(body, "4.1 Phân tích thành phần dữ liệu", "4.1.1 Sơ đồ ER của hệ thống",
                new List<OpenXmlElement>
                {
                    P("Cơ sở dữ liệu của hệ thống chợ nông sản được thiết kế theo mô hình quan hệ, phản ánh đầy đủ các nhóm nghiệp vụ cốt lõi gồm quản lý người dùng, quản lý nông trại, quản lý sản phẩm, giao dịch bán hàng, thanh toán và quản lý kho."),
                    P("Dựa trên tệp cơ sở dữ liệu thực tế `cho_nong_san_sach.sql`, hệ thống hiện có 16 bảng chính và 3 view hỗ trợ khai thác dữ liệu tổng hợp. Cách tổ chức này bảo đảm dữ liệu được tách theo đúng trách nhiệm nghiệp vụ, đồng thời thuận lợi cho việc mở rộng và bảo trì hệ thống.")
                });

            ReplaceBetween(body, "4.1.1 Sơ đồ ER của hệ thống", "Hình 41.",
                new List<OpenXmlElement>
                {
                    P("Sơ đồ ER mô tả mối quan hệ logic giữa các thực thể trọng tâm như TAI_KHOAN, NONG_DAN, SAN_PHAM, DANH_MUC, DON_HANG, CHI_TIET_DON_HANG, THANH_TOAN, KHO_HANG, TON_KHO và HOA_DON. Các thực thể được chia thành ba cụm nghiệp vụ chính: cụm định danh người dùng, cụm giao dịch thương mại điện tử và cụm quản lý kho.")
                });

            ReplaceEntitySection(body);
            ReplaceConstraintSection(body);

            doc.MainDocumentPart.Document.Save();
        }
    }

    static void ReplaceEntitySection(Body body)
    {
        var templateTable = body.Elements<Table>().FirstOrDefault();
        var nodes = new List<OpenXmlElement>();

        nodes.Add(P("Phần này trình bày chi tiết các thực thể quan trọng trong cơ sở dữ liệu theo từng nhóm nghiệp vụ. Mỗi bảng được mô tả theo vai trò, các thuộc tính chính và ý nghĩa sử dụng trong toàn bộ hệ thống."));

        nodes.Add(P("4.2.1 Nhóm thực thể định danh và danh mục"));
        AddEntity(nodes, templateTable, "Loại thực thể TAI_KHOAN",
            "Thực thể TAI_KHOAN là bảng gốc dùng để lưu thông tin định danh, xác thực và phân quyền của toàn bộ người dùng trong hệ thống. Tất cả các vai trò như người mua, nông dân và quản trị viên đều được quản lý tập trung tại thực thể này.",
            "Bảng 4.1. Mô tả thực thể TAI_KHOAN.",
            new List<string[]> {
                R("ma_tai_khoan","INT","x","","x","Khóa chính định danh duy nhất cho mỗi tài khoản."),
                R("ho_ten","VARCHAR(100)","","","x","Họ và tên hiển thị của người dùng."),
                R("email","VARCHAR(150)","","x","x","Địa chỉ thư điện tử dùng để đăng nhập hệ thống."),
                R("so_dien_thoai","VARCHAR(15)","","x","","Số điện thoại liên hệ của người dùng."),
                R("mat_khau","VARCHAR(255)","","","x","Mật khẩu đã được mã hóa để phục vụ xác thực."),
                R("vai_tro","ENUM('quan_tri','nong_dan','nguoi_mua')","","","x","Vai trò nghiệp vụ của tài khoản."),
                R("anh_dai_dien","VARCHAR(500)","","","","Dữ liệu hoặc đường dẫn ảnh đại diện."),
                R("dia_chi","TEXT","","","","Địa chỉ liên hệ hoặc giao nhận mặc định."),
                R("con_hoat_dong","TINYINT(1)","","","x","Trạng thái hoạt động của tài khoản."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo tài khoản."),
                R("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật gần nhất.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể NONG_DAN",
            "Thực thể NONG_DAN lưu phần thông tin nghiệp vụ mở rộng dành riêng cho các tài khoản có vai trò nông dân. Bảng này giúp hệ thống quản lý nông trại, khu vực hoạt động và trạng thái xác minh của người bán.",
            "Bảng 4.2. Mô tả thực thể NONG_DAN.",
            new List<string[]> {
                R("ma_nong_dan","INT","x","","x","Khóa chính định danh nông dân."),
                R("ma_tai_khoan","INT","","x","x","Liên kết một - một tới bảng TAI_KHOAN."),
                R("ten_nong_trai","VARCHAR(200)","","","x","Tên nông trại hoặc thương hiệu bán hàng."),
                R("gioi_thieu","TEXT","","","","Nội dung giới thiệu tổng quan về nông trại."),
                R("tinh_thanh","VARCHAR(100)","","","","Tỉnh hoặc thành phố hoạt động."),
                R("quan_huyen","VARCHAR(100)","","","","Quận, huyện hoặc khu vực sản xuất."),
                R("dia_chi","TEXT","","","","Địa chỉ chi tiết của nông trại."),
                R("da_xac_minh","TINYINT(1)","","","x","Trạng thái xác minh hồ sơ nông dân."),
                R("ngay_xac_minh","TIMESTAMP","","","","Thời điểm nông dân được xác minh."),
                R("diem_danh_gia","DECIMAL(3,2)","","","x","Điểm đánh giá trung bình của nông dân."),
                R("tong_danh_gia","INT","","","x","Tổng số lượt đánh giá."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo hồ sơ nông dân."),
                R("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật gần nhất.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể DANH_MUC",
            "Thực thể DANH_MUC được dùng để chuẩn hóa nhóm sản phẩm trên website. Việc tách bảng danh mục giúp lọc, tìm kiếm và quản trị dữ liệu bán hàng thuận lợi hơn.",
            "Bảng 4.3. Mô tả thực thể DANH_MUC.",
            new List<string[]> {
                R("ma_danh_muc","INT","x","","x","Khóa chính định danh danh mục."),
                R("ten_danh_muc","VARCHAR(100)","","","x","Tên danh mục hiển thị cho người dùng."),
                R("duong_dan","VARCHAR(120)","","x","x","Slug dùng cho URL và định danh duy nhất."),
                R("bieu_tuong","VARCHAR(100)","","","","Biểu tượng minh họa cho danh mục."),
                R("thu_tu","INT","","","x","Thứ tự sắp xếp hiển thị."),
                R("con_hoat_dong","TINYINT(1)","","","x","Trạng thái hoạt động của danh mục.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể SAN_PHAM",
            "Thực thể SAN_PHAM là bảng trung tâm của hệ thống, lưu toàn bộ thông tin về mặt hàng nông sản đang được niêm yết. Thực thể này liên kết trực tiếp với nông dân, danh mục, đánh giá, giỏ hàng, chi tiết đơn hàng và tồn kho.",
            "Bảng 4.4. Mô tả thực thể SAN_PHAM.",
            new List<string[]> {
                R("ma_san_pham","INT","x","","x","Khóa chính định danh duy nhất của sản phẩm."),
                R("ma_nong_dan","INT","","","x","Tham chiếu đến nông dân sở hữu sản phẩm."),
                R("ma_danh_muc","INT","","","x","Tham chiếu đến danh mục của sản phẩm."),
                R("ten_san_pham","VARCHAR(200)","","","x","Tên hiển thị của mặt hàng nông sản."),
                R("duong_dan","VARCHAR(220)","","x","x","Slug dùng cho đường dẫn chi tiết sản phẩm."),
                R("mo_ta","TEXT","","","","Mô tả đặc điểm, nguồn gốc hoặc quy cách sản phẩm."),
                R("gia_ban","DECIMAL(12,0)","","","x","Đơn giá bán niêm yết."),
                R("don_vi","VARCHAR(30)","","","x","Đơn vị tính của sản phẩm."),
                R("ton_kho","INT","","","x","Tổng số lượng tồn hiện thời của sản phẩm."),
                R("ton_kho_toi_thieu","INT","","","x","Ngưỡng tồn tối thiểu để phát sinh cảnh báo."),
                R("hinh_anh","JSON","","","","Danh sách hình ảnh minh họa của sản phẩm."),
                R("con_hoat_dong","TINYINT(1)","","","x","Trạng thái còn được phép hiển thị và bán hay không."),
                R("so_luong_ban","INT","","","x","Tổng số lượng đã bán."),
                R("diem_danh_gia","DECIMAL(3,2)","","","x","Điểm đánh giá trung bình của sản phẩm."),
                R("tong_danh_gia","INT","","","x","Tổng số lượt đánh giá."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo sản phẩm."),
                R("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật gần nhất.")
            });

        nodes.Add(P("4.2.2 Nhóm thực thể giao dịch bán hàng"));
        AddEntity(nodes, templateTable, "Loại thực thể GIO_HANG",
            "Thực thể GIO_HANG lưu tạm thời các sản phẩm mà người mua lựa chọn trước khi chuyển thành đơn hàng chính thức.",
            "Bảng 4.5. Mô tả thực thể GIO_HANG.",
            new List<string[]> {
                R("ma_gio_hang","INT","x","","x","Khóa chính định danh dòng giỏ hàng."),
                R("ma_tai_khoan","INT","","","x","Tài khoản người mua sở hữu giỏ hàng."),
                R("ma_san_pham","INT","","","x","Sản phẩm được thêm vào giỏ."),
                R("so_luong","INT","","","x","Số lượng dự kiến đặt."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm thêm sản phẩm vào giỏ."),
                R("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật gần nhất.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể DON_HANG",
            "Thực thể DON_HANG ghi nhận giao dịch mua bán hoàn chỉnh giữa người mua và hệ thống, bao gồm tổng tiền, trạng thái xử lý, phương thức thanh toán và thông tin giao nhận.",
            "Bảng 4.6. Mô tả thực thể DON_HANG.",
            new List<string[]> {
                R("ma_don_hang","INT","x","","x","Khóa chính định danh đơn hàng."),
                R("ma_nguoi_mua","INT","","","x","Tài khoản người mua tạo đơn."),
                R("tong_tien_hang","DECIMAL(14,0)","","","x","Tổng tiền hàng trước phí vận chuyển."),
                R("phi_van_chuyen","DECIMAL(10,0)","","","x","Phí vận chuyển của đơn hàng."),
                R("tong_thanh_toan","DECIMAL(14,0)","","","x","Tổng số tiền cần thanh toán."),
                R("trang_thai","ENUM('cho_xac_nhan','da_xac_nhan','dang_giao','da_giao','da_huy')","","","x","Trạng thái nghiệp vụ của đơn hàng."),
                R("phuong_thuc_tt","ENUM('tien_mat','vnpay')","","","x","Phương thức thanh toán được chọn."),
                R("trang_thai_tt","ENUM('chua_tt','da_tt')","","","x","Trạng thái hoàn tất thanh toán."),
                R("dia_chi_giao","TEXT","","","x","Địa chỉ nhận hàng."),
                R("ghi_chu","TEXT","","","","Ghi chú bổ sung cho giao hàng."),
                R("ly_do_huy","TEXT","","","","Lý do hủy đơn nếu có."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo đơn hàng."),
                R("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật gần nhất.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể CHI_TIET_DON_HANG",
            "Thực thể CHI_TIET_DON_HANG biểu diễn từng dòng sản phẩm nằm trong một đơn hàng. Việc tách riêng bảng này cho phép một đơn hàng chứa nhiều loại nông sản khác nhau.",
            "Bảng 4.7. Mô tả thực thể CHI_TIET_DON_HANG.",
            new List<string[]> {
                R("ma_chi_tiet","INT","x","","x","Khóa chính định danh dòng chi tiết đơn."),
                R("ma_don_hang","INT","","","x","Tham chiếu tới đơn hàng cha."),
                R("ma_san_pham","INT","","","x","Tham chiếu tới sản phẩm được mua."),
                R("ma_nong_dan","INT","","","x","Nông dân sở hữu sản phẩm ở thời điểm giao dịch."),
                R("ten_san_pham","VARCHAR(200)","","","x","Tên sản phẩm được lưu tại thời điểm đặt hàng."),
                R("hinh_san_pham","VARCHAR(500)","","","","Ảnh sản phẩm tại thời điểm đặt hàng."),
                R("don_vi","VARCHAR(30)","","","x","Đơn vị tính của sản phẩm."),
                R("so_luong","INT","","","x","Số lượng được mua."),
                R("gia_tai_thoi_diem","DECIMAL(12,0)","","","x","Đơn giá tại thời điểm chốt đơn."),
                R("thanh_tien","DECIMAL(14,0)","","","x","Thành tiền của dòng sản phẩm.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể THANH_TOAN",
            "Thực thể THANH_TOAN lưu vết giao dịch thanh toán tương ứng với từng đơn hàng, hỗ trợ đối soát và truy vết trạng thái xử lý.",
            "Bảng 4.8. Mô tả thực thể THANH_TOAN.",
            new List<string[]> {
                R("ma_thanh_toan","INT","x","","x","Khóa chính định danh giao dịch thanh toán."),
                R("ma_don_hang","INT","","x","x","Liên kết một - một với đơn hàng."),
                R("phuong_thuc","ENUM('tien_mat','vnpay')","","","x","Phương thức thanh toán thực tế."),
                R("so_tien","DECIMAL(14,0)","","","x","Số tiền được thanh toán."),
                R("ma_giao_dich","VARCHAR(200)","","x","","Mã giao dịch từ cổng thanh toán nếu có."),
                R("du_lieu_cong","JSON","","","","Dữ liệu phản hồi bổ sung từ cổng thanh toán."),
                R("trang_thai","ENUM('cho_xu_ly','thanh_cong','that_bai')","","","x","Kết quả xử lý thanh toán."),
                R("ngay_thanh_toan","TIMESTAMP","","","","Thời điểm thanh toán hoàn tất."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo bản ghi thanh toán."),
                R("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật gần nhất.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể DANH_GIA",
            "Thực thể DANH_GIA phản ánh ý kiến của người mua sau khi nhận hàng. Đây là nguồn dữ liệu quan trọng để tính điểm uy tín cho sản phẩm và nông dân.",
            "Bảng 4.9. Mô tả thực thể DANH_GIA.",
            new List<string[]> {
                R("ma_danh_gia","INT","x","","x","Khóa chính định danh bản ghi đánh giá."),
                R("ma_nguoi_mua","INT","","","x","Tài khoản người mua thực hiện đánh giá."),
                R("ma_san_pham","INT","","","x","Sản phẩm được đánh giá."),
                R("ma_don_hang","INT","","","x","Đơn hàng làm căn cứ phát sinh đánh giá."),
                R("so_sao","TINYINT","","","x","Số sao đánh giá."),
                R("noi_dung","TEXT","","","","Nội dung nhận xét chi tiết."),
                R("hinh_anh","JSON","","","","Hình ảnh minh chứng kèm theo đánh giá."),
                R("phan_hoi_nd","TEXT","","","","Phản hồi của nông dân đối với đánh giá."),
                R("ngay_phan_hoi","TIMESTAMP","","","","Thời điểm nông dân phản hồi."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo đánh giá.")
            });

        nodes.Add(P("4.2.3 Nhóm thực thể quản lý kho"));
        AddEntity(nodes, templateTable, "Loại thực thể KHO_HANG",
            "Thực thể KHO_HANG lưu thông tin các kho vật lý dùng để lưu trữ nông sản. Mỗi kho có thể chứa nhiều sản phẩm và nhiều vị trí chứa hàng bên trong.",
            "Bảng 4.10. Mô tả thực thể KHO_HANG.",
            new List<string[]> {
                R("ma_kho","INT","x","","x","Khóa chính định danh kho hàng."),
                R("ten_kho","VARCHAR(200)","","","x","Tên gọi của kho."),
                R("ma_quan_ly","INT","","","x","Tài khoản quản lý kho."),
                R("dia_diem","TEXT","","","","Địa chỉ hoặc vị trí kho."),
                R("mo_ta","TEXT","","","","Thông tin mô tả bổ sung về kho."),
                R("con_hoat_dong","TINYINT(1)","","","x","Trạng thái hoạt động của kho."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo kho.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể VI_TRI_KHO_HANG",
            "Thực thể VI_TRI_KHO_HANG chuẩn hóa sơ đồ vị trí trong mỗi kho theo mã vị trí, kệ, tầng và ô chứa. Thiết kế này giúp thao tác nhập - xuất kho nhất quán hơn so với cách nhập tay vị trí.",
            "Bảng 4.11. Mô tả thực thể VI_TRI_KHO_HANG.",
            new List<string[]> {
                R("ma_vi_tri","INT","x","","x","Khóa chính định danh vị trí kho."),
                R("ma_kho","INT","","","x","Kho hàng mà vị trí này trực thuộc."),
                R("ma_vi_tri_code","VARCHAR(40)","","x","x","Mã vị trí ngắn gọn, ví dụ A-2-04."),
                R("ten_vi_tri","VARCHAR(120)","","","x","Tên vị trí hiển thị đầy đủ."),
                R("mo_ta","VARCHAR(255)","","","","Mô tả bổ sung của vị trí kho."),
                R("con_su_dung","TINYINT(1)","","","x","Trạng thái còn được sử dụng hay không."),
                R("ngay_tao","TIMESTAMP","","","","Thời điểm tạo vị trí kho.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể TON_KHO",
            "Thực thể TON_KHO lưu số lượng hàng hiện có của từng sản phẩm tại từng kho. Ngoài số lượng, bảng còn hỗ trợ theo dõi hạn sử dụng, vị trí lưu và ngày nhập kho.",
            "Bảng 4.12. Mô tả thực thể TON_KHO.",
            new List<string[]> {
                R("ma_ton_kho","INT","x","","x","Khóa chính định danh bản ghi tồn kho."),
                R("ma_kho","INT","","","x","Kho chứa hàng."),
                R("ma_san_pham","INT","","","x","Sản phẩm đang được lưu kho."),
                R("so_luong","INT","","","x","Số lượng hiện còn tại kho tương ứng."),
                R("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm đồng bộ tồn kho gần nhất."),
                R("han_su_dung","DATE","","","","Ngày hết hạn của lô hàng."),
                R("vi_tri_kho","VARCHAR(120)","","","","Tên hoặc mã vị trí lưu thực tế."),
                R("ngay_nhap_kho","DATETIME","","","","Thời điểm nhập kho của lô hàng.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể HOA_DON",
            "Thực thể HOA_DON biểu diễn chứng từ nhập kho hoặc xuất kho. Đây là bảng đầu mối của phân hệ kho, dùng để theo dõi trạng thái chứng từ và liên hệ với đơn hàng nếu phiếu xuất phát sinh tự động từ giao dịch bán hàng.",
            "Bảng 4.13. Mô tả thực thể HOA_DON.",
            new List<string[]> {
                R("ma_hoa_don","INT","x","","x","Khóa chính định danh hóa đơn kho."),
                R("so_hoa_don","VARCHAR(50)","","x","x","Số chứng từ duy nhất của hóa đơn."),
                R("loai_hoa_don","ENUM('nhap_kho','xuat_kho')","","","x","Phân loại chứng từ nhập hoặc xuất."),
                R("ma_kho","INT","","","x","Kho phát sinh nghiệp vụ."),
                R("ma_nong_dan","INT","","","","Nông dân liên quan nếu có."),
                R("ma_don_hang","INT","","","","Đơn hàng liên quan nếu là phiếu xuất tự động."),
                R("nguoi_tao","INT","","","x","Tài khoản tạo hóa đơn."),
                R("tong_tien","DECIMAL(14,0)","","","x","Tổng giá trị của hóa đơn kho."),
                R("ghi_chu","TEXT","","","","Ghi chú nghiệp vụ bổ sung."),
                R("trang_thai","ENUM('nhap','da_xac_nhan','da_huy')","","","x","Trạng thái xử lý chứng từ."),
                R("ngay_xac_nhan","TIMESTAMP","","","","Thời điểm chứng từ được xác nhận."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo hóa đơn.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể CHI_TIET_HOA_DON",
            "Thực thể CHI_TIET_HOA_DON lưu danh sách mặt hàng cụ thể thuộc từng hóa đơn kho. Mỗi dòng phản ánh một loại sản phẩm cùng số lượng, đơn giá và thông tin lưu kho liên quan.",
            "Bảng 4.14. Mô tả thực thể CHI_TIET_HOA_DON.",
            new List<string[]> {
                R("ma_chi_tiet","INT","x","","x","Khóa chính định danh dòng chi tiết hóa đơn."),
                R("ma_hoa_don","INT","","","x","Tham chiếu đến hóa đơn kho cha."),
                R("ma_san_pham","INT","","","x","Sản phẩm phát sinh nhập hoặc xuất kho."),
                R("ten_san_pham","VARCHAR(200)","","","x","Tên sản phẩm tại thời điểm lập phiếu."),
                R("so_luong","INT","","","x","Số lượng nhập hoặc xuất."),
                R("don_vi","VARCHAR(30)","","","x","Đơn vị tính trong phiếu."),
                R("don_gia","DECIMAL(12,0)","","","x","Đơn giá của dòng hàng."),
                R("thanh_tien","DECIMAL(14,0)","","","x","Thành tiền của dòng chi tiết."),
                R("han_su_dung","DATE","","","","Hạn sử dụng gắn với dòng hàng nếu có."),
                R("vi_tri_kho","VARCHAR(120)","","","","Vị trí lưu hàng trong kho.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể LICH_SU_KHO",
            "Thực thể LICH_SU_KHO ghi lại mọi biến động tăng giảm tồn kho để phục vụ truy vết và đối chiếu. Bảng này có ý nghĩa quan trọng trong công tác kiểm toán nghiệp vụ kho.",
            "Bảng 4.15. Mô tả thực thể LICH_SU_KHO.",
            new List<string[]> {
                R("ma_lich_su","INT","x","","x","Khóa chính định danh bản ghi lịch sử kho."),
                R("ma_kho","INT","","","x","Kho phát sinh biến động."),
                R("ma_san_pham","INT","","","x","Sản phẩm bị tác động."),
                R("ma_hoa_don","INT","","","x","Hóa đơn kho làm căn cứ cập nhật."),
                R("loai_phieu","ENUM('nhap_kho','xuat_kho')","","","x","Loại biến động kho."),
                R("so_luong","INT","","","x","Số lượng tăng hoặc giảm."),
                R("ton_truoc","INT","","","x","Số lượng tồn trước khi cập nhật."),
                R("ton_sau","INT","","","x","Số lượng tồn sau khi cập nhật."),
                R("ghi_chu","TEXT","","","","Ghi chú bổ sung của nghiệp vụ kho."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo bản ghi lịch sử.")
            });

        AddEntity(nodes, templateTable, "Loại thực thể CANH_BAO_KHO",
            "Thực thể CANH_BAO_KHO được sử dụng để tự động ghi nhận các trường hợp tồn kho giảm xuống dưới ngưỡng tối thiểu hoặc cần được xử lý bởi quản trị viên.",
            "Bảng 4.16. Mô tả thực thể CANH_BAO_KHO.",
            new List<string[]> {
                R("ma_canh_bao","INT","x","","x","Khóa chính định danh cảnh báo kho."),
                R("ma_san_pham","INT","","","x","Sản phẩm phát sinh cảnh báo."),
                R("ma_kho","INT","","","x","Kho chứa hàng phát sinh cảnh báo."),
                R("ton_hien_tai","INT","","","x","Mức tồn tại thời điểm sinh cảnh báo."),
                R("ton_toi_thieu","INT","","","x","Ngưỡng tối thiểu dùng để so sánh."),
                R("da_xu_ly","TINYINT(1)","","","x","Trạng thái đã xử lý hay chưa."),
                R("ngay_xu_ly","TIMESTAMP","","","","Thời điểm cảnh báo được xử lý."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm phát sinh cảnh báo.")
            });

        nodes.Add(P("4.2.4 Nhóm thực thể hỗ trợ hệ thống"));
        AddEntity(nodes, templateTable, "Loại thực thể THONG_BAO",
            "Thực thể THONG_BAO hỗ trợ gửi và lưu vết các thông báo nghiệp vụ tới người dùng như cập nhật đơn hàng, duyệt nông dân hoặc cảnh báo liên quan đến hệ thống.",
            "Bảng 4.17. Mô tả thực thể THONG_BAO.",
            new List<string[]> {
                R("ma_thong_bao","INT","x","","x","Khóa chính định danh thông báo."),
                R("ma_tai_khoan","INT","","","x","Tài khoản người nhận thông báo."),
                R("loai_tb","VARCHAR(50)","","","x","Loại thông báo theo ngữ cảnh nghiệp vụ."),
                R("tieu_de","VARCHAR(200)","","","x","Tiêu đề của thông báo."),
                R("noi_dung","TEXT","","","x","Nội dung chi tiết gửi đến người dùng."),
                R("du_lieu_them","JSON","","","","Dữ liệu bổ sung kèm theo thông báo."),
                R("da_doc","TINYINT(1)","","","x","Trạng thái đã đọc hay chưa."),
                R("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo thông báo.")
            });

        ReplaceBetween(body, "4.2 Mô tả chi tiết các thực thể", "4.3 Mô tả các ràng buộc dữ liệu", nodes);
    }

    static void ReplaceConstraintSection(Body body)
    {
        ReplaceBetween(body, "4.3 Mô tả các ràng buộc dữ liệu", "5. Thiết kế và triển khai hệ thống",
            new List<OpenXmlElement>
            {
                P("Từ mô hình dữ liệu trên, có thể xác định các ràng buộc dữ liệu quan trọng của hệ thống như sau:"),
                P("Thứ nhất, nhóm ràng buộc định danh yêu cầu mỗi bản ghi phải có khóa chính duy nhất. Các trường như `email` của TAI_KHOAN, `duong_dan` của DANH_MUC và SAN_PHAM, `so_hoa_don` của HOA_DON hay cặp (`ma_kho`, `ma_san_pham`) của TON_KHO phải bảo đảm tính duy nhất để tránh trùng lặp dữ liệu nghiệp vụ."),
                P("Thứ hai, nhóm ràng buộc liên kết quy định rằng mỗi hồ sơ NONG_DAN phải gắn với đúng một TAI_KHOAN; mỗi SAN_PHAM phải thuộc một NONG_DAN và một DANH_MUC; mỗi DON_HANG phải thuộc một người mua hợp lệ; mỗi CHI_TIET_DON_HANG phải tham chiếu đến một DON_HANG và một SAN_PHAM tồn tại; mỗi THANH_TOAN chỉ gắn với một DON_HANG duy nhất; và mỗi THONG_BAO phải có người nhận cụ thể."),
                P("Thứ ba, đối với phân hệ kho, mỗi bản ghi TON_KHO chỉ được tồn tại một lần cho một cặp kho - sản phẩm; mỗi CHI_TIET_HOA_DON phải thuộc về đúng một HOA_DON; mỗi bản ghi LICH_SU_KHO phải phản ánh một biến động thực tế phát sinh từ chứng từ kho; và vị trí lưu trữ nếu được khai báo phải phù hợp với kho đang quản lý để bảo đảm tính nhất quán trong vận hành."),
                P("Thứ tư, nhóm ràng buộc nghiệp vụ yêu cầu số lượng tồn kho không được âm; trạng thái đơn hàng và trạng thái thanh toán phải tuân theo luồng xử lý đã định nghĩa; đánh giá chỉ được ghi nhận cho sản phẩm nằm trong đơn hàng tương ứng; và cảnh báo kho chỉ có ý nghĩa khi số lượng tồn hiện tại nhỏ hơn hoặc bằng ngưỡng tồn tối thiểu của sản phẩm."),
                P("Ngoài các bảng chính, hệ thống còn sử dụng ba view là `v_hoa_don_chi_tiet`, `v_san_pham_nong_dan` và `v_ton_kho_chi_tiet` để phục vụ nhu cầu tổng hợp dữ liệu ở tầng ứng dụng. Các view này không làm thay đổi chuẩn hóa dữ liệu gốc nhưng giúp tăng khả năng khai thác thông tin cho giao diện quản trị và báo cáo.")
            });
    }

    static void AddEntity(List<OpenXmlElement> nodes, Table templateTable, string title, string summary, string caption, List<string[]> rows)
    {
        nodes.Add(P(title));
        nodes.Add(P(summary));
        nodes.Add(P(caption));
        nodes.Add(CreateTable(templateTable, rows));
    }

    static Table CreateTable(Table templateTable, List<string[]> rows)
    {
        var table = new Table();
        if (templateTable != null && templateTable.GetFirstChild<TableProperties>() != null)
        {
            table.Append((TableProperties)templateTable.GetFirstChild<TableProperties>().CloneNode(true));
        }
        else
        {
            table.Append(new TableProperties(
                new TableBorders(
                    new TopBorder { Val = BorderValues.Single, Size = 8 },
                    new BottomBorder { Val = BorderValues.Single, Size = 8 },
                    new LeftBorder { Val = BorderValues.Single, Size = 8 },
                    new RightBorder { Val = BorderValues.Single, Size = 8 },
                    new InsideHorizontalBorder { Val = BorderValues.Single, Size = 8 },
                    new InsideVerticalBorder { Val = BorderValues.Single, Size = 8 })));
        }

        table.Append(CreateRow(new [] { "Thuộc tính", "Kiểu", "K", "U", "M", "Diễn giải" }));
        foreach (var row in rows) table.Append(CreateRow(row));
        return table;
    }

    static TableRow CreateRow(string[] values)
    {
        var row = new TableRow();
        foreach (var value in values)
        {
            row.Append(new TableCell(
                new Paragraph(new Run(new Text(value) { Space = SpaceProcessingModeValues.Preserve })),
                new TableCellProperties(new TableCellWidth { Type = TableWidthUnitValues.Auto })));
        }
        return row;
    }

    static string[] R(string a, string b, string c, string d, string e, string f)
    {
        return new [] { a, b, c, d, e, f };
    }

    static Paragraph P(string text)
    {
        return new Paragraph(new Run(new Text(text) { Space = SpaceProcessingModeValues.Preserve }));
    }

    static void SetParagraphByStartsWith(Body body, string startsWith, string newText)
    {
        var p = FindParagraphStartsWith(body, startsWith);
        if (p == null) return;
        p.RemoveAllChildren<Run>();
        p.Append(new Run(new Text(newText) { Space = SpaceProcessingModeValues.Preserve }));
    }

    static Paragraph FindParagraphStartsWith(Body body, string startsWith)
    {
        return body.Elements<Paragraph>().FirstOrDefault(p => GetText(p).StartsWith(startsWith, StringComparison.Ordinal));
    }

    static string GetText(Paragraph p)
    {
        return string.Concat(p.Descendants<Text>().Select(t => t.Text));
    }

    static void ReplaceBetween(Body body, string startText, string endText, List<OpenXmlElement> newNodes)
    {
        var start = FindParagraphStartsWith(body, startText);
        var end = FindParagraphStartsWith(body, endText);
        if (start == null || end == null) return;

        var toRemove = new List<OpenXmlElement>();
        for (OpenXmlElement node = start.NextSibling(); node != null && node != end; node = node.NextSibling())
        {
            toRemove.Add(node);
        }
        foreach (var node in toRemove) node.Remove();
        foreach (var node in newNodes) body.InsertBefore(node, end);
    }

    static void InsertImageBeforeCaption(WordprocessingDocument doc, Body body, string captionStart, string imagePath, long cx, long cy)
    {
        if (!File.Exists(imagePath)) return;
        var caption = FindParagraphStartsWith(body, captionStart);
        if (caption == null) return;
        var prev = caption.PreviousSibling<Paragraph>();
        if (prev != null && prev.Descendants<Drawing>().Any()) return;

        var imagePart = doc.MainDocumentPart.AddImagePart(ImagePartType.Png);
        using (var stream = File.OpenRead(imagePath)) imagePart.FeedData(stream);
        var relId = doc.MainDocumentPart.GetIdOfPart(imagePart);

        var drawing = new Drawing(
            new DW.Inline(
                new DW.Extent() { Cx = cx, Cy = cy },
                new DW.EffectExtent() { LeftEdge = 0L, TopEdge = 0L, RightEdge = 0L, BottomEdge = 0L },
                new DW.DocProperties() { Id = (UInt32Value)1U, Name = Path.GetFileNameWithoutExtension(imagePath) },
                new DW.NonVisualGraphicFrameDrawingProperties(new A.GraphicFrameLocks() { NoChangeAspect = true }),
                new A.Graphic(
                    new A.GraphicData(
                        new PIC.Picture(
                            new PIC.NonVisualPictureProperties(
                                new PIC.NonVisualDrawingProperties() { Id = (UInt32Value)0U, Name = Path.GetFileName(imagePath) },
                                new PIC.NonVisualPictureDrawingProperties()),
                            new PIC.BlipFill(
                                new A.Blip() { Embed = relId },
                                new A.Stretch(new A.FillRectangle())),
                            new PIC.ShapeProperties(
                                new A.Transform2D(
                                    new A.Offset() { X = 0L, Y = 0L },
                                    new A.Extents() { Cx = cx, Cy = cy }),
                                new A.PresetGeometry(new A.AdjustValueList()) { Preset = A.ShapeTypeValues.Rectangle })))
                    { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" })
            )
            {
                DistanceFromTop = 0U,
                DistanceFromBottom = 0U,
                DistanceFromLeft = 0U,
                DistanceFromRight = 0U
            });

        body.InsertBefore(new Paragraph(new Run(drawing)), caption);
    }
}
'@

[void][Reflection.Assembly]::LoadFrom($openXmlDll)
Add-Type -TypeDefinition $code -ReferencedAssemblies @($openXmlDll, 'WindowsBase')
[ReportChapter4BuilderV2]::Run($targetDoc, $imageDir)

Get-Item $targetDoc | Select-Object FullName, Length, LastWriteTime
