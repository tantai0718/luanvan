$ErrorActionPreference = 'Stop'

$outputDoc = 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\Mo_ta_nghiep_vu_website_cho_nong_san.docx'
$openXmlDll = 'C:\Program Files\Windows Defender Advanced Threat Protection\Classification\Dprt\DocumentFormat.OpenXml.dll'

$code = @'
using System;
using System.Collections.Generic;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

public static class BusinessProcessDocBuilder
{
    public static void Run(string path)
    {
        using (var doc = WordprocessingDocument.Create(path, WordprocessingDocumentType.Document))
        {
            var mainPart = doc.AddMainDocumentPart();
            mainPart.Document = new Document();
            var body = new Body();
            mainPart.Document.Append(body);

            body.Append(Paragraph("MÔ TẢ NGHIỆP VỤ", 28, true, "2E74B5", JustificationValues.Center, 160, 40));
            body.Append(Paragraph("HỆ THỐNG WEBSITE CHỢ NÔNG SẢN", 28, true, "2E74B5", JustificationValues.Center, 0, 140));
            body.Append(Paragraph("Tài liệu này mô tả các nghiệp vụ đã được triển khai trong website hiện tại, bám trực tiếp vào giao diện frontend, API backend và dữ liệu thực tế của dự án.", 22, false, "666666", JustificationValues.Center, 0, 220));

            body.Append(SimpleTable(
                new[] { 3200, 6160 },
                new[]
                {
                    new[] { "Tên tài liệu", "Mô tả nghiệp vụ hệ thống website chợ nông sản" },
                    new[] { "Phạm vi", "Người mua, nông dân, quản trị viên, đơn hàng, đặt trước, giao định kỳ và kho hàng" },
                    new[] { "Nguồn đối chiếu", "Mã nguồn frontend ReactJS, backend Node.js/ExpressJS và dữ liệu MySQL của dự án hiện tại" },
                    new[] { "Ngày lập", DateTime.Now.ToString("dd/MM/yyyy") },
                },
                true
            ));

            body.Append(PageBreakParagraph());

            AddHeading1(body, "1. Tổng quan tài liệu");
            body.Append(BodyText("Tài liệu này được xây dựng nhằm mô tả rõ các luồng nghiệp vụ đang vận hành trong hệ thống website chợ nông sản. Nội dung được tổng hợp trực tiếp từ mã nguồn hiện tại của dự án, vì vậy chỉ phản ánh những chức năng đã thực sự có trên web."));
            body.Append(BodyText("Phạm vi trình bày bao gồm các nhóm chức năng chính như xác thực, sản phẩm, giỏ hàng, đơn hàng, đặt trước, giao định kỳ, quản lý sản phẩm phía nông dân, quản trị hệ thống và quản lý kho hàng."));

            AddHeading2(body, "1.1. Nhóm chức năng hiện có trên hệ thống");
            body.Append(HeaderTable(
                new[] { 2200, 2200, 4960 },
                "Nhóm nghiệp vụ", "Vai trò sử dụng", "Mô tả ngắn",
                new List<string[]>
                {
                    new[] { "Xác thực", "Người mua, nông dân, admin", "Đăng ký, đăng nhập, xem hồ sơ và thay đổi mật khẩu." },
                    new[] { "Sản phẩm", "Người mua, nông dân, admin", "Xem danh sách, xem chi tiết, thêm sửa sản phẩm và kiểm soát trạng thái hiển thị." },
                    new[] { "Mua hàng", "Người mua", "Giỏ hàng, đơn hàng thường, hủy đơn và theo dõi trạng thái xử lý." },
                    new[] { "Đặt trước", "Người mua, admin", "Tạo đơn đặt trước cho những đợt hàng có ngày giao dự kiến trong tương lai." },
                    new[] { "Giao định kỳ", "Người mua, nông dân, admin", "Đăng ký giao lặp lại theo tuần, hai tuần hoặc tháng." },
                    new[] { "Kho hàng", "Admin", "Nhập xuất kho, vị trí lưu, hạn sử dụng, tồn kho và cảnh báo kho." },
                    new[] { "Quản trị hệ thống", "Admin", "Tài khoản, danh mục, sản phẩm, đơn hàng và giám sát dữ liệu vận hành." },
                }
            ));

            AddHeading1(body, "2. Tác nhân và phạm vi sử dụng");
            body.Append(BodyText("Hệ thống hiện có ba vai trò người dùng chính. Mỗi vai trò đảm nhận một nhóm nghiệp vụ riêng, nhưng các luồng vẫn liên kết với nhau thông qua sản phẩm, đơn hàng và dữ liệu kho hàng."));
            body.Append(BodyText("Người mua là đối tượng trực tiếp sử dụng website để tìm kiếm sản phẩm, mua hàng, đặt trước, đăng ký giao định kỳ và đánh giá. Nông dân chịu trách nhiệm quản lý gian hàng và xử lý đơn liên quan đến nông trại của mình. Quản trị viên có vai trò kiểm soát toàn bộ dữ liệu hệ thống, bao gồm tài khoản, danh mục, sản phẩm, đơn hàng và kho."));

            AddHeading1(body, "3. Nghiệp vụ phía người mua");
            body.Append(BodyText("Nhóm nghiệp vụ người mua là phần trung tâm của website, bao gồm toàn bộ luồng từ tiếp cận sản phẩm cho đến hoàn tất đơn hàng và phản hồi sau mua."));
            AddStepTable(body,
                "3.1. Luồng xem và lựa chọn sản phẩm",
                new List<string[]>
                {
                    new[] { "1", "Truy cập trang chủ hoặc trang sản phẩm", "Hệ thống tải danh sách sản phẩm công khai, hỗ trợ tìm kiếm, lọc theo danh mục, giá, khu vực và tình trạng còn hàng." },
                    new[] { "2", "Mở trang chi tiết sản phẩm", "Người mua xem được ảnh, mô tả, giá bán, đơn vị, tồn kho, thông tin nông trại, đánh giá và các sản phẩm liên quan." },
                    new[] { "3", "Chọn số lượng", "Hệ thống kiểm soát số lượng để không vượt quá tồn kho đang có của sản phẩm." },
                    new[] { "4", "Thêm vào giỏ hoặc mua ngay", "Nếu chưa đăng nhập thì chuyển tới màn đăng nhập; nếu hợp lệ thì sản phẩm được thêm vào giỏ hàng." },
                }
            );
            AddStepTable(body,
                "3.2. Luồng mua hàng thông thường",
                new List<string[]>
                {
                    new[] { "1", "Mở giỏ hàng", "Người mua xem được các sản phẩm đã chọn, số lượng, đơn giá và tổng tiền tạm tính." },
                    new[] { "2", "Cập nhật giỏ hàng", "Có thể tăng giảm số lượng, xóa từng sản phẩm hoặc xóa toàn bộ giỏ." },
                    new[] { "3", "Nhập thông tin giao hàng", "Hệ thống ghi nhận địa chỉ giao, ghi chú và phương thức thanh toán." },
                    new[] { "4", "Tạo đơn hàng", "Backend sinh đơn hàng, chi tiết đơn hàng, cập nhật tồn kho và trả lại thông tin đơn cho người mua." },
                    new[] { "5", "Theo dõi trạng thái đơn", "Người mua có thể xem danh sách đơn, chi tiết đơn và hủy đơn trong các trạng thái cho phép." },
                }
            );
            AddStepTable(body,
                "3.3. Luồng đặt trước nông sản",
                new List<string[]>
                {
                    new[] { "1", "Mở khối Đặt trước ở trang chi tiết sản phẩm", "Người mua nhập số lượng, ngày giao dự kiến, địa chỉ giao và ghi chú cho đơn đặt trước." },
                    new[] { "2", "Xác nhận tạo đơn đặt trước", "Hệ thống tạo đơn với loại đơn là đặt trước và lưu ngày giao dự kiến để theo dõi." },
                    new[] { "3", "Theo dõi đơn đặt trước", "Đơn đặt trước xuất hiện chung trong khu vực đơn hàng để người mua quản lý tập trung." },
                }
            );
            AddStepTable(body,
                "3.4. Luồng đăng ký giao định kỳ",
                new List<string[]>
                {
                    new[] { "1", "Mở khối Giao định kỳ ở trang chi tiết sản phẩm", "Người mua nhập số lượng mỗi kỳ, ngày bắt đầu, tần suất giao và số kỳ giao." },
                    new[] { "2", "Gửi đăng ký", "Hệ thống tạo bản ghi giao định kỳ, xác định ngày giao tiếp theo và trạng thái hoạt động." },
                    new[] { "3", "Quản lý đăng ký", "Người mua xem danh sách đăng ký trong trang đơn hàng và có thể hủy khi cần." },
                }
            );
            AddStepTable(body,
                "3.5. Luồng đánh giá sản phẩm",
                new List<string[]>
                {
                    new[] { "1", "Kiểm tra điều kiện đánh giá", "Người mua chỉ được gửi đánh giá nếu đã có đơn hàng ở trạng thái đã giao và đơn đó chứa sản phẩm cần đánh giá." },
                    new[] { "2", "Gửi số sao và nhận xét", "Hệ thống lưu đánh giá, gắn với sản phẩm, người mua và đơn hàng tương ứng." },
                    new[] { "3", "Cập nhật điểm trung bình", "Sau khi lưu đánh giá, hệ thống tính lại điểm đánh giá và tổng số lượt đánh giá của sản phẩm." },
                }
            );

            AddHeading1(body, "4. Nghiệp vụ phía nông dân");
            body.Append(BodyText("Vai trò nông dân được thiết kế để quản lý gian hàng và theo dõi hoạt động bán hàng gắn với nông trại. Nông dân có thể xem dashboard tổng quan, cập nhật hồ sơ nông trại, thêm sửa sản phẩm, thay đổi trạng thái hiển thị, theo dõi đơn hàng liên quan và xem các đăng ký giao định kỳ phát sinh từ sản phẩm của mình."));

            AddHeading1(body, "5. Nghiệp vụ phía quản trị viên");
            AddStepTable(body,
                "5.1. Quản lý tài khoản và nông dân",
                new List<string[]>
                {
                    new[] { "1", "Xem danh sách tài khoản", "Admin truy cập danh sách tài khoản, lọc theo vai trò và trạng thái hoạt động." },
                    new[] { "2", "Khóa hoặc mở khóa tài khoản", "Trạng thái hoạt động của tài khoản được cập nhật trực tiếp trên hệ thống." },
                    new[] { "3", "Duyệt nông dân", "Admin xác minh hồ sơ nông dân trước khi cho phép vận hành đầy đủ." },
                    new[] { "4", "Xóa nông dân", "Khi xóa, hệ thống dọn tài khoản, sản phẩm, tồn kho, đánh giá và các dữ liệu vận hành liên quan đến nông dân đó." },
                }
            );
            AddStepTable(body,
                "5.2. Quản lý danh mục, sản phẩm và đơn hàng",
                new List<string[]>
                {
                    new[] { "1", "Quản lý danh mục", "Admin thêm, sửa, ẩn hiện danh mục và xem sản phẩm thuộc từng danh mục." },
                    new[] { "2", "Quản lý sản phẩm toàn hệ thống", "Admin theo dõi điểm đánh giá, trạng thái hoạt động và chất lượng dữ liệu sản phẩm." },
                    new[] { "3", "Quản lý đơn hàng", "Admin xem đơn thường, đơn đặt trước, cập nhật trạng thái và hỗ trợ xử lý hủy đơn." },
                    new[] { "4", "Theo dõi đăng ký giao định kỳ", "Admin xem được toàn bộ các đăng ký giao lặp lại để phục vụ công tác vận hành." },
                }
            );
            body.Append(BodyText("Bên cạnh các chức năng trên, dashboard quản trị còn cung cấp cái nhìn tổng hợp về tài khoản, nông dân, sản phẩm, đơn hàng và dữ liệu kho hàng."));

            AddHeading1(body, "6. Nghiệp vụ kho hàng");
            body.Append(BodyText("Kho hàng là phần mở rộng giúp hệ thống không chỉ xử lý giao dịch mua bán mà còn quản lý hàng hóa ở mức vận hành thực tế."));
            AddStepTable(body,
                "6.1. Luồng nhập - xuất kho",
                new List<string[]>
                {
                    new[] { "1", "Tạo hóa đơn kho", "Admin chọn loại nhập hoặc xuất, kho hàng, sản phẩm, số lượng, đơn giá và ghi chú." },
                    new[] { "2", "Khai báo vị trí lưu và hạn sử dụng", "Mỗi dòng hàng có thể gắn vị trí trong kho, ngày nhập và hạn sử dụng để theo dõi chi tiết hơn." },
                    new[] { "3", "Xác nhận hóa đơn", "Khi xác nhận, hệ thống cập nhật tồn kho, lịch sử kho và kiểm tra cảnh báo tồn." },
                    new[] { "4", "Hủy hóa đơn", "Nếu hóa đơn bị hủy, hệ thống giữ trạng thái để phục vụ đối chiếu nghiệp vụ." },
                }
            );
            AddStepTable(body,
                "6.2. Theo dõi tồn kho và cảnh báo",
                new List<string[]>
                {
                    new[] { "1", "Xem tồn kho theo kho", "Admin biết được mỗi sản phẩm đang nằm ở kho nào, số lượng còn bao nhiêu và vị trí cất giữ." },
                    new[] { "2", "Cập nhật metadata tồn kho", "Có thể bổ sung vị trí, hạn sử dụng và ngày nhập cho từng dòng tồn kho." },
                    new[] { "3", "Kiểm tra cảnh báo", "Hệ thống phát hiện các trường hợp sắp hết hàng hoặc thiếu thông tin kho cần bổ sung." },
                    new[] { "4", "Đồng bộ với đơn hàng", "Khi đơn hàng tạo hoặc bị hủy, hệ thống hỗ trợ trừ hoặc hoàn lại tồn kho tương ứng theo dữ liệu kho." },
                }
            );

            AddHeading1(body, "7. Mối liên kết giữa các nghiệp vụ");
            body.Append(BodyText("Các nghiệp vụ trong hệ thống không tách rời nhau mà liên kết theo một chuỗi xử lý thống nhất. Sản phẩm là trung tâm của luồng mua hàng, đồng thời cũng là đối tượng chính trong kho, đánh giá, đăng ký giao định kỳ và các báo cáo quản trị."));
            body.Append(BodyText("Người mua tạo ra nhu cầu thông qua việc xem sản phẩm, thêm vào giỏ, mua hàng, đặt trước hoặc đăng ký giao định kỳ. Nông dân và quản trị viên chịu trách nhiệm duy trì thông tin sản phẩm, còn kho hàng đảm nhận việc theo dõi số lượng thực tế, vị trí lưu trữ, hạn sử dụng và biến động nhập xuất."));

            AddHeading1(body, "8. Kết luận");
            body.Append(BodyText("Tài liệu mô tả nghiệp vụ cho thấy hệ thống hiện đã triển khai tương đối đầy đủ các luồng cốt lõi của một website chợ nông sản: xác thực người dùng, quản lý sản phẩm, mua hàng, đặt trước, giao định kỳ, đánh giá, quản trị và kho hàng."));
            body.Append(BodyText("Toàn bộ nội dung trong tài liệu đều được viết theo những chức năng hiện có trên web, không bổ sung các nghiệp vụ chưa được hiện thực hóa. Tài liệu có thể dùng làm nền tảng cho báo cáo đồ án, mô tả hệ thống hoặc tiếp tục mở rộng thành tài liệu nghiệp vụ chi tiết hơn ở giai đoạn luận văn."));

            body.Append(CreateSectionProperties());
            mainPart.Document.Save();
        }
    }

    static SectionProperties CreateSectionProperties()
    {
        return new SectionProperties(
            new PageSize() { Width = 12240, Height = 15840 },
            new PageMargin() { Top = 1440, Right = 1440, Bottom = 1440, Left = 1440, Header = 708, Footer = 708, Gutter = 0 }
        );
    }

    static Paragraph Paragraph(string text, int halfPointSize, bool bold, string colorHex, JustificationValues justify, int before, int after)
    {
        return new Paragraph(
            new ParagraphProperties(
                new Justification() { Val = justify },
                new SpacingBetweenLines() { Before = before.ToString(), After = after.ToString(), Line = "264", LineRule = LineSpacingRuleValues.Auto }
            ),
            new Run(
                new RunProperties(
                    new RunFonts() { Ascii = "Calibri", HighAnsi = "Calibri", ComplexScript = "Calibri" },
                    new Bold() { Val = bold },
                    new Color() { Val = colorHex },
                    new FontSize() { Val = halfPointSize.ToString() },
                    new FontSizeComplexScript() { Val = halfPointSize.ToString() }
                ),
                new Text(text) { Space = SpaceProcessingModeValues.Preserve }
            )
        );
    }

    static Paragraph BodyText(string text)
    {
        return Paragraph(text, 22, false, "222222", JustificationValues.Both, 0, 100);
    }

    static void AddHeading1(Body body, string text)
    {
        body.Append(Paragraph(text, 32, true, "2E74B5", JustificationValues.Left, 220, 120));
    }

    static void AddHeading2(Body body, string text)
    {
        body.Append(Paragraph(text, 26, true, "2E74B5", JustificationValues.Left, 140, 80));
    }

    static Table SimpleTable(int[] widths, string[][] rows, bool shadeFirstColumn)
    {
        var table = BaseTable(widths);
        foreach (var rowData in rows)
        {
            var tr = new TableRow();
            for (int i = 0; i < rowData.Length; i++)
            {
                var tc = Cell(rowData[i], widths[i], i == 0 ? "000000" : "222222", i == 0, i == 0 && shadeFirstColumn ? "F2F4F7" : null);
                tr.Append(tc);
            }
            table.Append(tr);
        }
        return table;
    }

    static Table HeaderTable(int[] widths, string c1, string c2, string c3, List<string[]> rows)
    {
        var table = BaseTable(widths);
        var header = new TableRow();
        header.Append(Cell(c1, widths[0], "000000", true, "E8EEF5"));
        header.Append(Cell(c2, widths[1], "000000", true, "E8EEF5"));
        header.Append(Cell(c3, widths[2], "000000", true, "E8EEF5"));
        table.Append(header);

        foreach (var row in rows)
        {
            var tr = new TableRow();
            tr.Append(Cell(row[0], widths[0], "222222", false, null));
            tr.Append(Cell(row[1], widths[1], "222222", false, null));
            tr.Append(Cell(row[2], widths[2], "222222", false, null));
            table.Append(tr);
        }
        return table;
    }

    static void AddStepTable(Body body, string title, List<string[]> rows)
    {
        body.Append(Paragraph(title, 26, true, "2E74B5", JustificationValues.Left, 140, 80));
        var table = BaseTable(new[] { 900, 2500, 5960 });
        var header = new TableRow();
        header.Append(Cell("Bước", 900, "000000", true, "F2F4F7"));
        header.Append(Cell("Thao tác", 2500, "000000", true, "F2F4F7"));
        header.Append(Cell("Kết quả nghiệp vụ", 5960, "000000", true, "F2F4F7"));
        table.Append(header);
        foreach (var row in rows)
        {
            var tr = new TableRow();
            tr.Append(Cell(row[0], 900, "222222", false, null));
            tr.Append(Cell(row[1], 2500, "222222", false, null));
            tr.Append(Cell(row[2], 5960, "222222", false, null));
            table.Append(tr);
        }
        body.Append(table);
    }

    static Table BaseTable(int[] widths)
    {
        var table = new Table();
        var props = new TableProperties(
            new TableWidth() { Width = "9360", Type = TableWidthUnitValues.Dxa },
            new TableIndentation() { Width = 0, Type = TableWidthUnitValues.Dxa },
            new TableBorders(
                new TopBorder() { Val = BorderValues.Single, Size = 8, Color = "D8DDE6" },
                new BottomBorder() { Val = BorderValues.Single, Size = 8, Color = "D8DDE6" },
                new LeftBorder() { Val = BorderValues.Single, Size = 8, Color = "D8DDE6" },
                new RightBorder() { Val = BorderValues.Single, Size = 8, Color = "D8DDE6" },
                new InsideHorizontalBorder() { Val = BorderValues.Single, Size = 8, Color = "D8DDE6" },
                new InsideVerticalBorder() { Val = BorderValues.Single, Size = 8, Color = "D8DDE6" }
            ),
            new TableCellMarginDefault(
                new TopMargin() { Width = "90", Type = TableWidthUnitValues.Dxa },
                new BottomMargin() { Width = "90", Type = TableWidthUnitValues.Dxa },
                new TableCellLeftMargin() { Width = 120, Type = TableWidthValues.Dxa },
                new TableCellRightMargin() { Width = 120, Type = TableWidthValues.Dxa }
            )
        );
        table.Append(props);
        var grid = new TableGrid();
        foreach (var width in widths)
        {
            grid.Append(new GridColumn() { Width = width.ToString() });
        }
        table.Append(grid);
        return table;
    }

    static TableCell Cell(string text, int width, string color, bool bold, string fill)
    {
        var tcProps = new TableCellProperties(new TableCellWidth() { Width = width.ToString(), Type = TableWidthUnitValues.Dxa });
        if (!string.IsNullOrEmpty(fill))
        {
            tcProps.Append(new Shading() { Fill = fill, Val = ShadingPatternValues.Clear, Color = "auto" });
        }

        var para = new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines() { Before = "0", After = "0", Line = "240", LineRule = LineSpacingRuleValues.Auto }
            ),
            new Run(
                new RunProperties(
                    new RunFonts() { Ascii = "Calibri", HighAnsi = "Calibri", ComplexScript = "Calibri" },
                    new Bold() { Val = bold },
                    new Color() { Val = color },
                    new FontSize() { Val = "22" },
                    new FontSizeComplexScript() { Val = "22" }
                ),
                new Text(text) { Space = SpaceProcessingModeValues.Preserve }
            )
        );
        return new TableCell(tcProps, para);
    }

    static Paragraph PageBreakParagraph()
    {
        return new Paragraph(new Run(new Break() { Type = BreakValues.Page }));
    }
}
'@

Add-Type -Path $openXmlDll
$refs = @(
    $openXmlDll,
    'WindowsBase'
)
Add-Type -ReferencedAssemblies $refs -TypeDefinition $code -Language CSharp
[BusinessProcessDocBuilder]::Run($outputDoc)
Write-Output $outputDoc
