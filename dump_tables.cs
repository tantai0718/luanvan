using System;
using System.Linq;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
class DumpTables {
  static void Main() {
    var path = @"D:\thuctap\chonongsan\cho_nong_san_FINAL\project\Bao_cao_website_cho_nong_san_hoan_chinh.docx";
    using (var doc = WordprocessingDocument.Open(path, false)) {
      var tables = doc.MainDocumentPart.Document.Body.Elements<Table>().ToList();
      int i = 0;
      foreach (var table in tables) {
        i++;
        Console.WriteLine("TABLE " + i);
        int r=0;
        foreach (var row in table.Elements<TableRow>()) {
          r++;
          var cells = row.Elements<TableCell>().Select(c => string.Join("", c.Descendants<Text>().Select(t => t.Text))).ToArray();
          Console.WriteLine(r + ": " + string.Join(" | ", cells));
        }
      }
    }
  }
}
