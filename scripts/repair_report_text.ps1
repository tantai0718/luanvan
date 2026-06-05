$ErrorActionPreference = 'Stop'

$targetDoc = if ($args.Count -gt 0 -and $args[0]) { $args[0] } else { 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\Bao_cao_website_cho_nong_san_hoan_thien_theo_web.docx' }
$openXmlDll = 'C:\Program Files\Windows Defender Advanced Threat Protection\Classification\Dprt\DocumentFormat.OpenXml.dll'

$code = @'
using System;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

public static class ReportRepair
{
    static readonly Encoding Cp1252 = Encoding.GetEncoding(1252);
    static readonly Encoding Utf8 = new UTF8Encoding(false);

    public static void Run(string path)
    {
        using (var doc = WordprocessingDocument.Open(path, true))
        {
            var body = doc.MainDocumentPart.Document.Body;
            int fixedParagraphs = 0;

            foreach (var paragraph in body.Descendants<Paragraph>().ToList())
            {
                var text = string.Concat(paragraph.Descendants<Text>().Select(t => t.Text));
                if (string.IsNullOrWhiteSpace(text) || !LooksMojibake(text))
                    continue;

                var repaired = Repair(text);
                if (repaired == text)
                    continue;

                paragraph.RemoveAllChildren<Run>();
                paragraph.AppendChild(new Run(new Text(repaired) { Space = SpaceProcessingModeValues.Preserve }));
                fixedParagraphs++;
            }

            doc.MainDocumentPart.Document.Save();
            Console.WriteLine("Fixed paragraphs: " + fixedParagraphs);
        }
    }

    static bool LooksMojibake(string text)
    {
        return text.Contains("Ã")
            || text.Contains("Â")
            || text.Contains("Ä")
            || text.Contains("Æ")
            || text.Contains("áº")
            || text.Contains("á»")
            || text.Contains("á¼")
            || text.Contains("á½")
            || text.Contains("á»¥")
            || text.Contains("â€")
            || text.Contains("Quáº")
            || text.Contains("Há»")
            || text.Contains("Pháº")
            || text.Contains("NgÆ°")
            || text.Contains("Ä‘")
            || text.Contains("má»")
            || text.Contains("tÃ");
    }

    static string Repair(string text)
    {
        string current = text;
        for (int i = 0; i < 3; i++)
        {
            var bytes = Cp1252.GetBytes(current);
            var repaired = Utf8.GetString(bytes);
            if (repaired == current)
                break;
            current = repaired;
            if (!LooksMojibake(current))
                break;
        }
        return current;
    }
}
'@

[void][Reflection.Assembly]::LoadFrom($openXmlDll)
Add-Type -TypeDefinition $code -ReferencedAssemblies @($openXmlDll, 'WindowsBase')
[ReportRepair]::Run($targetDoc)
