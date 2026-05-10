$ErrorActionPreference = 'Stop'

$sourceDoc = 'D:\thuctap\chonongsan\cho_nong_san_FINAL\Bao_cao_website_cho_nong_san.docx'
$targetDoc = 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\Bao_cao_website_cho_nong_san_chuong4_chi_tiet.docx'
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

public class EntitySpec
{
    public string Title;
    public string Summary;
    public string Caption;
    public List<string[]> Rows = new List<string[]>();
}

public static class ReportChapter4Builder
{
    public static void Run(string path, string imageDir)
    {
        using (var doc = WordprocessingDocument.Open(path, true))
        {
            var body = doc.MainDocumentPart.Document.Body;

            ReplaceParagraphText(body, "Phân tích thành phần dữ liệu", "4.1 Phân tích thành phần dữ liệu");
            ReplaceParagraphText(body, "Sơ đồ ER / sơ đồ lớp", "4.1.1 Sơ đồ ER của hệ thống");
            ReplaceParagraphText(body, "Hình 41. Sơ đồ quan niệm dữ liệu.", "Hình 41. Sơ đồ ER của hệ thống chợ nông sản.");
            ReplaceParagraphText(body, "Mô tả các loại thực thể/lớp", "4.2 Mô tả chi tiết các thực thể");
            ReplaceParagraphText(body, "Mô tả các ràng buộc dữ liệu", "4.3 Mô tả các ràng buộc dữ liệu");

            InsertImageBeforeCaption(doc, body, "Hình 31.", Path.Combine(imageDir, "usecase_nguoi_mua.png"), 6200000L, 3600000L);
            InsertImageBeforeCaption(doc, body, "Hình 32.", Path.Combine(imageDir, "usecase_quan_tri_nong_dan.png"), 6200000L, 3600000L);
            InsertImageBeforeCaption(doc, body, "Hình 41.", Path.Combine(imageDir, "erd_cho_nong_san.png"), 6200000L, 3900000L);

            ReplaceBetween(body,
                "4.1 Phân tích thành phần dữ liệu",
                "4.1.1 Sơ đồ ER của hệ thống",
                new List<OpenXmlElement>
                {
                    ParagraphOf("Cơ sở dữ liệu của hệ thống chợ nông sản được thiết kế theo mô hình quan hệ, phản ánh đầy đủ các nhóm nghiệp vụ cốt lõi gồm quản lý người dùng, quản lý nông trại, quản lý sản phẩm, giao dịch bán hàng, thanh toán và quản lý kho."),
                    ParagraphOf("Dựa trên tệp cơ sở dữ liệu thực tế `cho_nong_san_sach.sql`, hệ thống hiện có 16 bảng chính và 3 view hỗ trợ khai thác dữ liệu tổng hợp. Cách tổ chức này bảo đảm dữ liệu được tách theo đúng trách nhiệm nghiệp vụ, đồng thời thuận lợi cho việc mở rộng và bảo trì hệ thống sau này.")
                });

            ReplaceBetween(body,
                "4.1.1 Sơ đồ ER của hệ thống",
                "Hình 41.",
                new List<OpenXmlElement>
                {
                    ParagraphOf("Sơ đồ ER thể hiện mối quan hệ logic giữa các thực thể trọng tâm như TAI_KHOAN, NONG_DAN, SAN_PHAM, DANH_MUC, DON_HANG, CHI_TIET_DON_HANG, THANH_TOAN, KHO_HANG, TON_KHO và HOA_DON. Các thực thể được tổ chức theo ba cụm chức năng lớn là cụm định danh người dùng, cụm giao dịch thương mại điện tử và cụm quản lý kho hàng.")
                });

            ReplaceEntitySection(doc, body);
            ReplaceConstraintSection(body);

            doc.MainDocumentPart.Document.Save();
        }
    }

    private static void ReplaceEntitySection(WordprocessingDocument doc, Body body)
    {
        var tablePropsTemplate = body.Elements<Table>().FirstOrDefault();
        var insertionNodes = new List<OpenXmlElement>();

        insertionNodes.Add(ParagraphOf("Nội dung dưới đây mô tả chi tiết các thực thể trọng yếu trong cơ sở dữ liệu. Các thực thể được trình bày theo từng nhóm nghiệp vụ để thể hiện rõ vai trò của từng bảng trong toàn bộ hệ thống."));

        insertionNodes.Add(ParagraphOf("4.2.1 Nhóm thực thể định danh và danh mục"));
        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể TAI_KHOAN",
            "Thực thể TAI_KHOAN là bảng gốc dùng để lưu thông tin định danh, xác thực và phân quyền của toàn bộ người dùng trong hệ thống. Tất cả các vai trò như người mua, nông dân và quản trị viên đều được quản lý tập trung tại thực thể này.",
            "Bảng 4.1. Mô tả thực thể TAI_KHOAN.",
            new List<string[]>
            {
                Row("ma_tai_khoan","INT","x","","x","Khóa chính định danh duy nhất cho mỗi tài khoản."),
                Row("ho_ten","VARCHAR(100)","","","x","Họ và tên hiển thị của người dùng."),
                Row("email","VARCHAR(150)","","x","x","Địa chỉ thư điện tử dùng để đăng nhập hệ thống."),
                Row("so_dien_thoai","VARCHAR(15)","","x","","Số điện thoại liên hệ của người dùng."),
                Row("mat_khau","VARCHAR(255)","","","x","Mật khẩu đã được mã hóa để phục vụ xác thực."),
                Row("vai_tro","ENUM('quan_tri','nong_dan','nguoi_mua')","","","x","Xác định vai trò nghiệp vụ của tài khoản."),
                Row("anh_dai_dien","VARCHAR(500)","","","","Đường dẫn hoặc dữ liệu ảnh đại diện của người dùng."),
                Row("dia_chi","TEXT","","","","Địa chỉ liên hệ hoặc giao nhận mặc định."),
                Row("con_hoat_dong","TINYINT(1)","","","x","Trạng thái đang hoạt động hay bị khóa của tài khoản."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo tài khoản."),
                Row("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật gần nhất.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể NONG_DAN",
            "Thực thể NONG_DAN lưu phần thông tin nghiệp vụ mở rộng dành riêng cho các tài khoản có vai trò nông dân. Bảng này giúp hệ thống quản lý nông trại, khu vực hoạt động và trạng thái xác minh của người bán.",
            "Bảng 4.2. Mô tả thực thể NONG_DAN.",
            new List<string[]>
            {
                Row("ma_nong_dan","INT","x","","x","Khóa chính định danh nông dân."),
                Row("ma_tai_khoan","INT","","x","x","Liên kết một - một tới bảng TAI_KHOAN."),
                Row("ten_nong_trai","VARCHAR(200)","","","x","Tên thương hiệu hoặc tên nông trại."),
                Row("gioi_thieu","TEXT","","","","Phần giới thiệu tổng quan về nông trại."),
                Row("tinh_thanh","VARCHAR(100)","","","","Tỉnh hoặc thành phố hoạt động."),
                Row("quan_huyen","VARCHAR(100)","","","","Quận, huyện hoặc khu vực sản xuất."),
                Row("dia_chi","TEXT","","","","Địa chỉ chi tiết của nông trại."),
                Row("da_xac_minh","TINYINT(1)","","","x","Trạng thái xác minh hồ sơ nông dân."),
                Row("ngay_xac_minh","TIMESTAMP","","","","Thời điểm được xác minh."),
                Row("diem_danh_gia","DECIMAL(3,2)","","","x","Điểm đánh giá trung bình của nông dân."),
                Row("tong_danh_gia","INT","","","x","Tổng số lượt đánh giá nhận được."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo hồ sơ nông dân."),
                Row("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật gần nhất.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể DANH_MUC",
            "Thực thể DANH_MUC được dùng để chuẩn hóa nhóm sản phẩm trên website. Việc tách bảng danh mục giúp lọc, tìm kiếm và quản trị dữ liệu bán hàng thuận lợi hơn.",
            "Bảng 4.3. Mô tả thực thể DANH_MUC.",
            new List<string[]>
            {
                Row("ma_danh_muc","INT","x","","x","Khóa chính định danh danh mục."),
                Row("ten_danh_muc","VARCHAR(100)","","","x","Tên danh mục hiển thị cho người dùng."),
                Row("duong_dan","VARCHAR(120)","","x","x","Slug dùng cho URL và định danh duy nhất."),
                Row("bieu_tuong","VARCHAR(100)","","","","Biểu tượng minh họa cho danh mục."),
                Row("thu_tu","INT","","","x","Thứ tự sắp xếp hiển thị."),
                Row("con_hoat_dong","TINYINT(1)","","","x","Trạng thái hoạt động của danh mục.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể SAN_PHAM",
            "Thực thể SAN_PHAM là bảng trung tâm của hệ thống, lưu toàn bộ thông tin về mặt hàng nông sản đang được niêm yết. Thực thể này liên kết trực tiếp với nông dân, danh mục, đánh giá, giỏ hàng, chi tiết đơn hàng và tồn kho.",
            "Bảng 4.4. Mô tả thực thể SAN_PHAM.",
            new List<string[]>
            {
                Row("ma_san_pham","INT","x","","x","Khóa chính định danh duy nhất của sản phẩm."),
                Row("ma_nong_dan","INT","","","x","Tham chiếu đến nông dân sở hữu sản phẩm."),
                Row("ma_danh_muc","INT","","","x","Tham chiếu đến danh mục chứa sản phẩm."),
                Row("ten_san_pham","VARCHAR(200)","","","x","Tên hiển thị của mặt hàng nông sản."),
                Row("duong_dan","VARCHAR(220)","","x","x","Slug dùng cho đường dẫn chi tiết sản phẩm."),
                Row("mo_ta","TEXT","","","","Mô tả đặc điểm, nguồn gốc hoặc quy cách sản phẩm."),
                Row("gia_ban","DECIMAL(12,0)","","","x","Đơn giá bán niêm yết."),
                Row("don_vi","VARCHAR(30)","","","x","Đơn vị tính như kg, bó, chai hoặc gói."),
                Row("ton_kho","INT","","","x","Tổng số lượng tồn hiện thời của sản phẩm."),
                Row("ton_kho_toi_thieu","INT","","","x","Ngưỡng tối thiểu để phát sinh cảnh báo kho."),
                Row("hinh_anh","JSON","","","","Danh sách hình ảnh minh họa của sản phẩm."),
                Row("con_hoat_dong","TINYINT(1)","","","x","Trạng thái có đang được phép hiển thị và bán hay không."),
                Row("so_luong_ban","INT","","","x","Số lượng đã bán dùng cho thống kê."),
                Row("diem_danh_gia","DECIMAL(3,2)","","","x","Điểm đánh giá trung bình của sản phẩm."),
                Row("tong_danh_gia","INT","","","x","Tổng số lượt đánh giá của sản phẩm."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo sản phẩm."),
                Row("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật gần nhất.")
            }, tablePropsTemplate));

        insertionNodes.Add(ParagraphOf("4.2.2 Nhóm thực thể giao dịch bán hàng"));
        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể GIO_HANG",
            "Thực thể GIO_HANG lưu tạm thời các sản phẩm mà người mua lựa chọn trước khi chuyển thành đơn hàng chính thức.",
            "Bảng 4.5. Mô tả thực thể GIO_HANG.",
            new List<string[]>
            {
                Row("ma_gio_hang","INT","x","","x","Khóa chính định danh dòng giỏ hàng."),
                Row("ma_tai_khoan","INT","","","x","Tài khoản người mua sở hữu giỏ hàng."),
                Row("ma_san_pham","INT","","","x","Sản phẩm được thêm vào giỏ."),
                Row("so_luong","INT","","","x","Số lượng người mua dự kiến đặt."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm thêm sản phẩm vào giỏ."),
                Row("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật số lượng gần nhất.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể DON_HANG",
            "Thực thể DON_HANG ghi nhận giao dịch mua bán hoàn chỉnh giữa người mua và hệ thống, bao gồm tổng tiền, trạng thái xử lý, phương thức thanh toán và thông tin giao nhận.",
            "Bảng 4.6. Mô tả thực thể DON_HANG.",
            new List<string[]>
            {
                Row("ma_don_hang","INT","x","","x","Khóa chính định danh đơn hàng."),
                Row("ma_nguoi_mua","INT","","","x","Tài khoản người mua tạo đơn."),
                Row("tong_tien_hang","DECIMAL(14,0)","","","x","Tổng tiền của các dòng sản phẩm trước phí."),
                Row("phi_van_chuyen","DECIMAL(10,0)","","","x","Phí vận chuyển áp dụng cho đơn hàng."),
                Row("tong_thanh_toan","DECIMAL(14,0)","","","x","Tổng số tiền phải thanh toán."),
                Row("trang_thai","ENUM('cho_xac_nhan','da_xac_nhan','dang_giao','da_giao','da_huy')","","","x","Trạng thái nghiệp vụ của đơn hàng."),
                Row("phuong_thuc_tt","ENUM('tien_mat','vnpay')","","","x","Phương thức thanh toán được lựa chọn."),
                Row("trang_thai_tt","ENUM('chua_tt','da_tt')","","","x","Trạng thái hoàn tất thanh toán."),
                Row("dia_chi_giao","TEXT","","","x","Địa chỉ nhận hàng của người mua."),
                Row("ghi_chu","TEXT","","","","Ghi chú bổ sung cho quá trình giao hàng."),
                Row("ly_do_huy","TEXT","","","","Lý do hủy đơn nếu đơn không hoàn tất."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo đơn hàng."),
                Row("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật gần nhất.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể CHI_TIET_DON_HANG",
            "Thực thể CHI_TIET_DON_HANG biểu diễn từng dòng sản phẩm nằm trong một đơn hàng. Việc tách riêng bảng này giúp hệ thống hỗ trợ một đơn hàng chứa nhiều sản phẩm khác nhau.",
            "Bảng 4.7. Mô tả thực thể CHI_TIET_DON_HANG.",
            new List<string[]>
            {
                Row("ma_chi_tiet","INT","x","","x","Khóa chính định danh dòng chi tiết đơn."),
                Row("ma_don_hang","INT","","","x","Tham chiếu tới đơn hàng cha."),
                Row("ma_san_pham","INT","","","x","Tham chiếu tới sản phẩm được mua."),
                Row("ma_nong_dan","INT","","","x","Nông dân sở hữu sản phẩm ở thời điểm phát sinh giao dịch."),
                Row("ten_san_pham","VARCHAR(200)","","","x","Tên sản phẩm được lưu tại thời điểm đặt hàng."),
                Row("hinh_san_pham","VARCHAR(500)","","","","Ảnh đại diện của sản phẩm tại thời điểm đặt hàng."),
                Row("don_vi","VARCHAR(30)","","","x","Đơn vị tính của sản phẩm."),
                Row("so_luong","INT","","","x","Số lượng được mua."),
                Row("gia_tai_thoi_diem","DECIMAL(12,0)","","","x","Đơn giá tại thời điểm chốt đơn."),
                Row("thanh_tien","DECIMAL(14,0)","","","x","Thành tiền của dòng sản phẩm.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể THANH_TOAN",
            "Thực thể THANH_TOAN lưu vết giao dịch thanh toán tương ứng với từng đơn hàng, hỗ trợ đối soát và truy vết trạng thái xử lý.",
            "Bảng 4.8. Mô tả thực thể THANH_TOAN.",
            new List<string[]>
            {
                Row("ma_thanh_toan","INT","x","","x","Khóa chính định danh giao dịch thanh toán."),
                Row("ma_don_hang","INT","","x","x","Liên kết một - một với đơn hàng cần thanh toán."),
                Row("phuong_thuc","ENUM('tien_mat','vnpay')","","","x","Phương thức thanh toán thực tế."),
                Row("so_tien","DECIMAL(14,0)","","","x","Số tiền được thanh toán."),
                Row("ma_giao_dich","VARCHAR(200)","","x","","Mã giao dịch từ cổng thanh toán nếu có."),
                Row("du_lieu_cong","JSON","","","","Dữ liệu phản hồi bổ sung từ cổng thanh toán."),
                Row("trang_thai","ENUM('cho_xu_ly','thanh_cong','that_bai')","","","x","Kết quả xử lý thanh toán."),
                Row("ngay_thanh_toan","TIMESTAMP","","","","Thời điểm thanh toán hoàn tất."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo bản ghi thanh toán."),
                Row("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm cập nhật gần nhất.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể DANH_GIA",
            "Thực thể DANH_GIA phản ánh ý kiến của người mua sau khi nhận hàng. Đây là nguồn dữ liệu quan trọng để tính điểm uy tín cho sản phẩm và nông dân.",
            "Bảng 4.9. Mô tả thực thể DANH_GIA.",
            new List<string[]>
            {
                Row("ma_danh_gia","INT","x","","x","Khóa chính định danh bản ghi đánh giá."),
                Row("ma_nguoi_mua","INT","","","x","Tài khoản người mua thực hiện đánh giá."),
                Row("ma_san_pham","INT","","","x","Sản phẩm được đánh giá."),
                Row("ma_don_hang","INT","","","x","Đơn hàng làm căn cứ phát sinh đánh giá."),
                Row("so_sao","TINYINT","","","x","Số sao đánh giá từ người mua."),
                Row("noi_dung","TEXT","","","","Nội dung nhận xét chi tiết."),
                Row("hinh_anh","JSON","","","","Hình ảnh minh chứng kèm theo đánh giá."),
                Row("phan_hoi_nd","TEXT","","","","Phản hồi của nông dân đối với đánh giá."),
                Row("ngay_phan_hoi","TIMESTAMP","","","","Thời điểm nông dân phản hồi."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo đánh giá.")
            }, tablePropsTemplate));

        insertionNodes.Add(ParagraphOf("4.2.3 Nhóm thực thể quản lý kho"));
        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể KHO_HANG",
            "Thực thể KHO_HANG lưu thông tin các kho vật lý dùng để lưu trữ nông sản. Mỗi kho có thể chứa nhiều sản phẩm và nhiều vị trí chứa hàng bên trong.",
            "Bảng 4.10. Mô tả thực thể KHO_HANG.",
            new List<string[]>
            {
                Row("ma_kho","INT","x","","x","Khóa chính định danh kho hàng."),
                Row("ten_kho","VARCHAR(200)","","","x","Tên gọi của kho."),
                Row("ma_quan_ly","INT","","","x","Tài khoản chịu trách nhiệm quản lý kho."),
                Row("dia_diem","TEXT","","","","Địa chỉ hoặc vị trí kho."),
                Row("mo_ta","TEXT","","","","Thông tin mô tả bổ sung về kho."),
                Row("con_hoat_dong","TINYINT(1)","","","x","Trạng thái hoạt động của kho."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo kho hàng.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể VI_TRI_KHO_HANG",
            "Thực thể VI_TRI_KHO_HANG chuẩn hóa sơ đồ vị trí trong mỗi kho theo mã vị trí, kệ, tầng và ô chứa. Thiết kế này giúp thao tác nhập - xuất kho nhất quán hơn so với cách nhập tay vị trí.",
            "Bảng 4.11. Mô tả thực thể VI_TRI_KHO_HANG.",
            new List<string[]>
            {
                Row("ma_vi_tri","INT","x","","x","Khóa chính định danh vị trí kho."),
                Row("ma_kho","INT","","","x","Kho hàng mà vị trí này trực thuộc."),
                Row("ma_vi_tri_code","VARCHAR(40)","","x","x","Mã vị trí ngắn gọn, ví dụ A-2-04."),
                Row("ten_vi_tri","VARCHAR(120)","","","x","Tên vị trí hiển thị đầy đủ."),
                Row("mo_ta","VARCHAR(255)","","","","Mô tả bổ sung của vị trí kho."),
                Row("con_su_dung","TINYINT(1)","","","x","Trạng thái còn được sử dụng hay không."),
                Row("ngay_tao","TIMESTAMP","","","","Thời điểm tạo vị trí kho.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể TON_KHO",
            "Thực thể TON_KHO lưu số lượng hàng hiện có của từng sản phẩm tại từng kho. Ngoài số lượng, bảng còn hỗ trợ theo dõi hạn sử dụng, vị trí lưu và ngày nhập kho.",
            "Bảng 4.12. Mô tả thực thể TON_KHO.",
            new List<string[]>
            {
                Row("ma_ton_kho","INT","x","","x","Khóa chính định danh bản ghi tồn kho."),
                Row("ma_kho","INT","","","x","Kho chứa hàng."),
                Row("ma_san_pham","INT","","","x","Sản phẩm đang được lưu kho."),
                Row("so_luong","INT","","","x","Số lượng hiện còn tại kho tương ứng."),
                Row("ngay_cap_nhat","TIMESTAMP","","","x","Thời điểm đồng bộ tồn kho gần nhất."),
                Row("han_su_dung","DATE","","","","Ngày hết hạn của lô hàng đang lưu."),
                Row("vi_tri_kho","VARCHAR(120)","","","","Tên hoặc mã vị trí lưu thực tế."),
                Row("ngay_nhap_kho","DATETIME","","","","Thời điểm nhập kho của lô hàng.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể HOA_DON",
            "Thực thể HOA_DON biểu diễn chứng từ nhập kho hoặc xuất kho. Đây là bảng đầu mối của phân hệ kho, dùng để theo dõi trạng thái chứng từ và liên hệ với đơn hàng nếu phiếu xuất phát sinh tự động từ giao dịch bán hàng.",
            "Bảng 4.13. Mô tả thực thể HOA_DON.",
            new List<string[]>
            {
                Row("ma_hoa_don","INT","x","","x","Khóa chính định danh hóa đơn kho."),
                Row("so_hoa_don","VARCHAR(50)","","x","x","Số chứng từ duy nhất của hóa đơn."),
                Row("loai_hoa_don","ENUM('nhap_kho','xuat_kho')","","","x","Phân loại chứng từ nhập hoặc xuất."),
                Row("ma_kho","INT","","","x","Kho phát sinh nghiệp vụ."),
                Row("ma_nong_dan","INT","","","","Nông dân liên quan nếu có."),
                Row("ma_don_hang","INT","","","","Đơn hàng liên quan nếu là xuất kho theo bán hàng."),
                Row("nguoi_tao","INT","","","x","Tài khoản tạo hóa đơn."),
                Row("tong_tien","DECIMAL(14,0)","","","x","Tổng giá trị của hóa đơn kho."),
                Row("ghi_chu","TEXT","","","","Ghi chú nghiệp vụ bổ sung."),
                Row("trang_thai","ENUM('nhap','da_xac_nhan','da_huy')","","","x","Trạng thái xử lý chứng từ."),
                Row("ngay_xac_nhan","TIMESTAMP","","","","Thời điểm chứng từ được xác nhận."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo hóa đơn.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể CHI_TIET_HOA_DON",
            "Thực thể CHI_TIET_HOA_DON lưu danh sách mặt hàng cụ thể thuộc từng hóa đơn kho. Mỗi dòng phản ánh một loại sản phẩm cùng số lượng, đơn giá và thông tin lưu kho liên quan.",
            "Bảng 4.14. Mô tả thực thể CHI_TIET_HOA_DON.",
            new List<string[]>
            {
                Row("ma_chi_tiet","INT","x","","x","Khóa chính định danh dòng chi tiết hóa đơn."),
                Row("ma_hoa_don","INT","","","x","Tham chiếu đến hóa đơn kho cha."),
                Row("ma_san_pham","INT","","","x","Sản phẩm phát sinh nhập hoặc xuất kho."),
                Row("ten_san_pham","VARCHAR(200)","","","x","Tên sản phẩm tại thời điểm lập phiếu."),
                Row("so_luong","INT","","","x","Số lượng nhập hoặc xuất."),
                Row("don_vi","VARCHAR(30)","","","x","Đơn vị tính sử dụng trong phiếu."),
                Row("don_gia","DECIMAL(12,0)","","","x","Đơn giá của dòng hàng."),
                Row("thanh_tien","DECIMAL(14,0)","","","x","Thành tiền của dòng chi tiết."),
                Row("han_su_dung","DATE","","","","Hạn sử dụng gắn với dòng nhập kho nếu có."),
                Row("vi_tri_kho","VARCHAR(120)","","","","Vị trí lưu hàng tương ứng trong kho.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể LICH_SU_KHO",
            "Thực thể LICH_SU_KHO ghi lại mọi biến động tăng giảm tồn kho để phục vụ truy vết và đối chiếu. Bảng này có ý nghĩa quan trọng trong công tác kiểm toán nghiệp vụ kho.",
            "Bảng 4.15. Mô tả thực thể LICH_SU_KHO.",
            new List<string[]>
            {
                Row("ma_lich_su","INT","x","","x","Khóa chính định danh bản ghi lịch sử kho."),
                Row("ma_kho","INT","","","x","Kho phát sinh biến động."),
                Row("ma_san_pham","INT","","","x","Sản phẩm bị tác động."),
                Row("ma_hoa_don","INT","","","x","Hóa đơn kho làm căn cứ cập nhật."),
                Row("loai_phieu","ENUM('nhap_kho','xuat_kho')","","","x","Loại biến động kho."),
                Row("so_luong","INT","","","x","Số lượng tăng hoặc giảm."),
                Row("ton_truoc","INT","","","x","Số lượng tồn trước khi cập nhật."),
                Row("ton_sau","INT","","","x","Số lượng tồn sau khi cập nhật."),
                Row("ghi_chu","TEXT","","","","Ghi chú bổ sung của nghiệp vụ kho."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo bản ghi lịch sử.")
            }, tablePropsTemplate));

        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể CANH_BAO_KHO",
            "Thực thể CANH_BAO_KHO được sử dụng để tự động ghi nhận các trường hợp tồn kho giảm xuống dưới ngưỡng tối thiểu hoặc cần được xử lý bởi quản trị viên.",
            "Bảng 4.16. Mô tả thực thể CANH_BAO_KHO.",
            new List<string[]>
            {
                Row("ma_canh_bao","INT","x","","x","Khóa chính định danh cảnh báo kho."),
                Row("ma_san_pham","INT","","","x","Sản phẩm phát sinh cảnh báo."),
                Row("ma_kho","INT","","","x","Kho chứa hàng phát sinh cảnh báo."),
                Row("ton_hien_tai","INT","","","x","Mức tồn tại thời điểm sinh cảnh báo."),
                Row("ton_toi_thieu","INT","","","x","Ngưỡng tối thiểu dùng để so sánh."),
                Row("da_xu_ly","TINYINT(1)","","","x","Trạng thái đã xử lý hay chưa."),
                Row("ngay_xu_ly","TIMESTAMP","","","","Thời điểm cảnh báo được xử lý."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm phát sinh cảnh báo.")
            }, tablePropsTemplate));

        insertionNodes.Add(ParagraphOf("4.2.4 Nhóm thực thể hỗ trợ hệ thống"));
        insertionNodes.AddRange(BuildEntitySection(
            "Loại thực thể THONG_BAO",
            "Thực thể THONG_BAO hỗ trợ gửi và lưu vết các thông báo nghiệp vụ tới người dùng như cập nhật đơn hàng, duyệt nông dân hoặc cảnh báo liên quan đến hệ thống.",
            "Bảng 4.17. Mô tả thực thể THONG_BAO.",
            new List<string[]>
            {
                Row("ma_thong_bao","INT","x","","x","Khóa chính định danh thông báo."),
                Row("ma_tai_khoan","INT","","","x","Tài khoản người nhận thông báo."),
                Row("loai_tb","VARCHAR(50)","","","x","Loại thông báo theo ngữ cảnh nghiệp vụ."),
                Row("tieu_de","VARCHAR(200)","","","x","Tiêu đề tóm tắt của thông báo."),
                Row("noi_dung","TEXT","","","x","Nội dung chi tiết gửi đến người dùng."),
                Row("du_lieu_them","JSON","","","","Dữ liệu bổ sung kèm theo thông báo."),
                Row("da_doc","TINYINT(1)","","","x","Trạng thái đã đọc hay chưa."),
                Row("ngay_tao","TIMESTAMP","","","x","Thời điểm tạo thông báo.")
            }, tablePropsTemplate));

        ReplaceBetween(body, "4.2 Mô tả chi tiết các thực thể", "4.3 Mô tả các ràng buộc dữ liệu", insertionNodes);
    }

    private static void ReplaceConstraintSection(Body body)
    {
        var nodes = new List<OpenXmlElement>();
        nodes.Add(ParagraphOf("Từ mô hình dữ liệu trên, có thể xác định các ràng buộc dữ liệu quan trọng của hệ thống như sau:"));
        nodes.Add(ParagraphOf("Thứ nhất, nhóm ràng buộc định danh yêu cầu mỗi bản ghi phải có khóa chính duy nhất, trong đó các trường như `email` của TAI_KHOAN, `duong_dan` của DANH_MUC và SAN_PHAM, `so_hoa_don` của HOA_DON hay cặp (`ma_kho`, `ma_san_pham`) của TON_KHO phải bảo đảm tính duy nhất để tránh trùng lặp dữ liệu nghiệp vụ."));
        nodes.Add(ParagraphOf("Thứ hai, nhóm ràng buộc liên kết quy định rằng mỗi hồ sơ NONG_DAN phải gắn với đúng một TAI_KHOAN; mỗi SAN_PHAM phải thuộc một NONG_DAN và một DANH_MUC; mỗi DON_HANG phải thuộc một người mua hợp lệ; mỗi CHI_TIET_DON_HANG phải tham chiếu đến một DON_HANG và một SAN_PHAM tồn tại; mỗi THANH_TOAN chỉ gắn với một DON_HANG duy nhất; và mỗi THONG_BAO phải có người nhận cụ thể."));
        nodes.Add(ParagraphOf("Thứ ba, đối với phân hệ kho, mỗi bản ghi TON_KHO chỉ được tồn tại một lần cho một cặp kho - sản phẩm; mỗi CHI_TIET_HOA_DON phải thuộc về đúng một HOA_DON; mỗi bản ghi LICH_SU_KHO phải phản ánh một biến động thực tế phát sinh từ chứng từ kho; và vị trí lưu trữ nếu được khai báo phải phù hợp với kho đang quản lý để bảo đảm tính nhất quán trong vận hành."));
        nodes.Add(ParagraphOf("Thứ tư, nhóm ràng buộc nghiệp vụ yêu cầu số lượng tồn kho không được âm; trạng thái đơn hàng và trạng thái thanh toán phải tuân theo luồng xử lý đã định nghĩa; đánh giá chỉ được ghi nhận cho sản phẩm nằm trong đơn hàng tương ứng; và cảnh báo kho chỉ có ý nghĩa khi số lượng tồn hiện tại nhỏ hơn hoặc bằng ngưỡng tồn tối thiểu của sản phẩm."));
        nodes.Add(ParagraphOf("Ngoài các bảng chính, hệ thống còn sử dụng ba view là `v_hoa_don_chi_tiet`, `v_san_pham_nong_dan` và `v_ton_kho_chi_tiet` để phục vụ nhu cầu tổng hợp dữ liệu ở tầng ứng dụng. Các view này không làm thay đổi chuẩn hóa dữ liệu gốc nhưng giúp tăng khả năng khai thác thông tin cho giao diện quản trị và báo cáo."));

        ReplaceBetween(body, "4.3 Mô tả các ràng buộc dữ liệu", "Thiết kế và triển khai hệ thống", nodes);
        ReplaceParagraphText(body, "Thiết kế và triển khai hệ thống", "5. Thiết kế và triển khai hệ thống");
    }

    private static IEnumerable<OpenXmlElement> BuildEntitySection(string title, string summary, string caption, List<string[]> rows, Table templateTable)
    {
        var nodes = new List<OpenXmlElement>();
        nodes.Add(ParagraphOf(title));
        nodes.Add(ParagraphOf(summary));
        nodes.Add(ParagraphOf(caption));
        nodes.Add(CreateTable(rows, templateTable));
        return nodes;
    }

    private static Table CreateTable(List<string[]> dataRows, Table templateTable)
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

        table.Append(CreateRow(new[] { "Thuộc tính", "Kiểu", "K", "U", "M", "Diễn giải" }, true));
        foreach (var row in dataRows)
        {
            table.Append(CreateRow(row, false));
        }
        return table;
    }

    private static TableRow CreateRow(string[] values, bool isHeader)
    {
        var row = new TableRow();
        foreach (var value in values)
        {
            var p = new Paragraph(new Run(new Text(value) { Space = SpaceProcessingModeValues.Preserve }));
            var cellProps = new TableCellProperties(new TableCellWidth { Type = TableWidthUnitValues.Auto });
            var cell = new TableCell(p, cellProps);
            row.Append(cell);
        }
        return row;
    }

    private static string[] Row(string a, string b, string c, string d, string e, string f)
    {
        return new[] { a, b, c, d, e, f };
    }

    private static Paragraph ParagraphOf(string text)
    {
        return new Paragraph(new Run(new Text(text) { Space = SpaceProcessingModeValues.Preserve }));
    }

    private static void ReplaceParagraphText(Body body, string oldText, string newText)
    {
        var p = body.Elements<Paragraph>().FirstOrDefault(x => GetText(x) == oldText);
        if (p != null)
        {
            p.RemoveAllChildren<Run>();
            p.Append(new Run(new Text(newText) { Space = SpaceProcessingModeValues.Preserve }));
        }
    }

    private static void ReplaceBetween(Body body, string startText, string endText, List<OpenXmlElement> newNodes)
    {
        var start = FindParagraphStartsWith(body, startText);
        var end = FindParagraphStartsWith(body, endText);
        if (start == null || end == null) return;

        var remove = new List<OpenXmlElement>();
        for (OpenXmlElement node = start.NextSibling(); node != null && node != end; node = node.NextSibling())
        {
            remove.Add(node);
        }
        foreach (var node in remove) node.Remove();
        foreach (var node in newNodes)
        {
            body.InsertBefore(node, end);
        }
    }

    private static Paragraph FindParagraphStartsWith(Body body, string startsWith)
    {
        return body.Elements<Paragraph>().FirstOrDefault(p => GetText(p).StartsWith(startsWith, StringComparison.Ordinal));
    }

    private static string GetText(Paragraph p)
    {
        return string.Concat(p.Descendants<Text>().Select(t => t.Text));
    }

    private static void InsertImageBeforeCaption(WordprocessingDocument doc, Body body, string captionStart, string imagePath, long cx, long cy)
    {
        if (!File.Exists(imagePath)) return;
        var caption = FindParagraphStartsWith(body, captionStart);
        if (caption == null) return;
        if (caption.PreviousSibling<Paragraph>() != null && caption.PreviousSibling<Paragraph>().Descendants<Drawing>().Any()) return;

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
[ReportChapter4Builder]::Run($targetDoc, $imageDir)

Get-Item $targetDoc | Select-Object FullName, Length, LastWriteTime
