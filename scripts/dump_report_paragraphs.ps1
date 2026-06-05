$ErrorActionPreference = 'Stop'

$docPath = $args[0]
if (-not $docPath) {
  throw 'Missing document path.'
}

$openXmlDll = 'C:\Program Files\Windows Defender Advanced Threat Protection\Classification\Dprt\DocumentFormat.OpenXml.dll'

$code = @'
using System;
using System.Linq;
using System.Collections.Generic;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

public static class ReportDumper
{
    public static void Run(string path)
    {
        using (var doc = WordprocessingDocument.Open(path, false))
        {
            var paras = doc.MainDocumentPart.Document.Body.Descendants<Paragraph>().ToList();
            Console.WriteLine("COUNT=" + paras.Count);
            for (int i = 0; i < paras.Count; i++)
            {
                var text = string.Concat(paras[i].Descendants<Text>().Select(t => t.Text)).Trim();
                if (text.Length == 0) continue;
                Console.WriteLine(i.ToString("D3") + ": " + text);
            }
        }
    }
}
'@

[void][Reflection.Assembly]::LoadFrom($openXmlDll)
Add-Type -TypeDefinition $code -ReferencedAssemblies @($openXmlDll, 'WindowsBase')
[ReportDumper]::Run($docPath)
