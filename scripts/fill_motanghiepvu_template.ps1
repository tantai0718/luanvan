$ErrorActionPreference = 'Stop'

$sourceDoc = 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\motanghiepvu_mau.docx'
$targetDoc = 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\motanghiepvu_cho_nong_san.docx'
$openXmlDll = 'C:\Program Files\Windows Defender Advanced Threat Protection\Classification\Dprt\DocumentFormat.OpenXml.dll'

Copy-Item $sourceDoc $targetDoc -Force

$code = @'
using System;
using System.Collections.Generic;
using System.Linq;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

public static class TemplateFiller
{
    public static void Run(string path)
    {
        using (var doc = WordprocessingDocument.Open(path, true))
        {
            var body = doc.MainDocumentPart.Document.Body;
            var paragraphs = body.Elements<Paragraph>().ToList();
            var nonEmpty = paragraphs.Where(p => !string.IsNullOrWhiteSpace(p.InnerText)).ToList();
            if (nonEmpty.Count < 12)
            {
                throw new Exception("Mẫu không đủ số đoạn để thay nội dung.");
            }

            var lines = new List<string>
            {
                "Tên đề tài: XÂY DỰNG WEBSITE CHỢ NÔNG SẢN",
                "Mô tả nghiệp vụ:",
                "Đề tài “Xây dựng website chợ nông sản” được định hướng phát triển như một nền tảng hỗ trợ giới thiệu, tìm kiếm và đặt mua các mặt hàng nông sản trên môi trường trực tuyến. Hệ thống tập trung vào nhóm sản phẩm phục vụ nhu cầu tiêu dùng hằng ngày như rau củ, trái cây, đặc sản địa phương và các mặt hàng nông sản theo mùa. Bên cạnh mục tiêu bán hàng trực tuyến, website còn được mở rộng theo hướng hỗ trợ quản lý đơn hàng và quản lý kho để tăng khả năng ứng dụng thực tế.",
                "Hệ thống hiện được vận hành theo mô hình quản lý tập trung với hai nhóm đối tượng chính là khách hàng và quản trị viên. Đối với khách hàng, website mang đến trải nghiệm tìm kiếm sản phẩm, xem chi tiết, thêm vào giỏ hàng, đặt mua, đặt trước và đăng ký giao định kỳ một cách thuận tiện. Đối với quản trị viên, hệ thống cung cấp khu vực quản trị giúp kiểm soát tài khoản, danh mục, sản phẩm, đơn hàng và toàn bộ dữ liệu kho hàng trong cùng một nền tảng.",
                "Các chức năng chính của hệ thống",
                "Khách hàng:",
                "Quản lý tài khoản cá nhân: Đăng ký, đăng nhập, cập nhật thông tin cá nhân, thay đổi mật khẩu và theo dõi lịch sử đơn hàng đã phát sinh trên hệ thống.",
                "Tìm kiếm và lọc sản phẩm: Khách hàng có thể tìm sản phẩm theo từ khóa, danh mục, khu vực, khoảng giá và trạng thái còn hàng. Hệ thống cũng hỗ trợ sắp xếp theo mức giá, sản phẩm mới và đánh giá cao để giúp quá trình lựa chọn thuận tiện hơn.",
                "Xem chi tiết và đặt hàng: Khách hàng xem thông tin sản phẩm, hình ảnh, mô tả, giá bán, đơn vị tính, thông tin nguồn cung và đánh giá từ người mua trước. Sau đó có thể thêm vào giỏ hàng, mua ngay, tạo đơn đặt trước hoặc đăng ký giao nông sản định kỳ theo tuần, hai tuần hoặc theo tháng.",
                "Quản trị viên:",
                "Quản lý tài khoản, danh mục và sản phẩm: Quản trị viên có thể theo dõi danh sách tài khoản, khóa hoặc mở khóa tài khoản khi cần, quản lý danh mục sản phẩm và kiểm soát toàn bộ thông tin sản phẩm hiển thị trên website như tên, giá bán, hình ảnh, trạng thái hoạt động và đánh giá.",
                "Quản lý đơn hàng và kho hàng: Quản trị viên theo dõi đơn hàng thường, đơn đặt trước và đăng ký giao định kỳ; đồng thời quản lý nhập kho, xuất kho, tồn kho, vị trí lưu trữ, hạn sử dụng và các cảnh báo kho nhằm đảm bảo dữ liệu hàng hóa luôn được cập nhật đồng bộ với hoạt động mua bán."
            };

            for (int i = 0; i < lines.Count; i++)
            {
                ReplaceParagraphText(nonEmpty[i], lines[i]);
            }

            for (int i = lines.Count; i < nonEmpty.Count; i++)
            {
                ReplaceParagraphText(nonEmpty[i], "");
            }

            doc.MainDocumentPart.Document.Save();
        }
    }

    static void ReplaceParagraphText(Paragraph p, string text)
    {
        var firstRun = p.Elements<Run>().FirstOrDefault();
        RunProperties props = null;
        if (firstRun != null && firstRun.RunProperties != null)
        {
            props = (RunProperties)firstRun.RunProperties.CloneNode(true);
        }

        p.RemoveAllChildren<Run>();
        var run = new Run();
        if (props != null)
        {
            run.Append((RunProperties)props.CloneNode(true));
        }
        run.Append(new Text(text) { Space = SpaceProcessingModeValues.Preserve });
        p.Append(run);
    }
}
'@

Add-Type -Path $openXmlDll
Add-Type -ReferencedAssemblies @($openXmlDll,'WindowsBase') -TypeDefinition $code -Language CSharp
[TemplateFiller]::Run($targetDoc)
Write-Output $targetDoc
