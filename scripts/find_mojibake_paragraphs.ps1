$ErrorActionPreference = 'Stop'

$docPath = $args[0]
if (-not $docPath) { throw 'Missing document path.' }

$openXmlDll = 'C:\Program Files\Windows Defender Advanced Threat Protection\Classification\Dprt\DocumentFormat.OpenXml.dll'

$code = @'
using System;
using System.Linq;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

public static class MojibakeFinder
{
    public static void Run(string path)
    {
        using (var doc = WordprocessingDocument.Open(path, false))
        {
            var paragraphs = doc.MainDocumentPart.Document.Body.Descendants<Paragraph>().ToList();
            for (int i = 0; i < paragraphs.Count; i++)
            {
                var text = string.Concat(paragraphs[i].Descendants<Text>().Select(t => t.Text));
                if (string.IsNullOrWhiteSpace(text)) continue;
                if (LooksMojibake(text))
                {
                    Console.WriteLine(i.ToString("D3") + ": " + text);
                }
            }
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
            || text.Contains("Quáº")
            || text.Contains("Há»")
            || text.Contains("Pháº")
            || text.Contains("NgÆ°")
            || text.Contains("tÃ");
    }
}
'@

[void][Reflection.Assembly]::LoadFrom($openXmlDll)
Add-Type -TypeDefinition $code -ReferencedAssemblies @($openXmlDll, 'WindowsBase')
[MojibakeFinder]::Run($docPath)
