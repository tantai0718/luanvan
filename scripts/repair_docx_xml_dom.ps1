$ErrorActionPreference = 'Stop'

$sourceDoc = if ($args.Count -gt 0 -and $args[0]) { $args[0] } else { 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\Bao_cao_website_cho_nong_san_hoan_thien_theo_web_tmp.docx' }
$targetDoc = if ($args.Count -gt 1 -and $args[1]) { $args[1] } else { 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\Bao_cao_website_cho_nong_san_hoan_thien_theo_web_chuan.docx' }

Copy-Item $sourceDoc $targetDoc -Force

$cp1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8 = [System.Text.UTF8Encoding]::new($false)

function Test-Mojibake([string]$text) {
    foreach ($ch in $text.ToCharArray()) {
        $code = [int][char]$ch
        if ($code -eq 0x00C2 -or $code -eq 0x00C3 -or $code -eq 0x00C4 -or $code -eq 0x00C6) {
            return $true
        }
    }
    return $false
}

function Repair-Text([string]$text) {
    $current = $text
    for ($i = 0; $i -lt 3; $i++) {
        if (-not (Test-Mojibake $current)) { break }
        $bytes = $cp1252.GetBytes($current)
        $next = $utf8.GetString($bytes)
        if ($next -eq $current) { break }
        $current = $next
    }
    return $current
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($targetDoc, [System.IO.Compression.ZipArchiveMode]::Update)
$xmlEntries = $zip.Entries | Where-Object { $_.FullName -like 'word/*.xml' }
$totalFixes = 0

foreach ($entry in $xmlEntries) {
    $reader = [System.IO.StreamReader]::new($entry.Open(), [System.Text.Encoding]::UTF8)
    $xml = $reader.ReadToEnd()
    $reader.Dispose()

    $doc = New-Object System.Xml.XmlDocument
    $doc.PreserveWhitespace = $true

    try {
        $doc.LoadXml($xml)
    } catch {
        continue
    }

    $nodes = $doc.SelectNodes("//*[local-name()='t']")
    $fixedInFile = 0

    foreach ($node in $nodes) {
        $text = $node.InnerText
        if (-not (Test-Mojibake $text)) { continue }
        $repaired = Repair-Text $text
        if ($repaired -ne $text) {
            $node.InnerText = $repaired
            $fixedInFile++
        }
    }

    if ($fixedInFile -gt 0) {
        $totalFixes += $fixedInFile
        $entry.Delete()
        $newEntry = $zip.CreateEntry($entry.FullName)
        $writer = [System.IO.StreamWriter]::new($newEntry.Open(), $utf8)
        $settings = New-Object System.Xml.XmlWriterSettings
        $settings.Encoding = $utf8
        $settings.OmitXmlDeclaration = $false
        $settings.Indent = $false
        $xmlWriter = [System.Xml.XmlWriter]::Create($writer, $settings)
        $doc.Save($xmlWriter)
        $xmlWriter.Dispose()
        $writer.Dispose()
    }
}

$zip.Dispose()

Write-Output ("Fixed text nodes: {0}" -f $totalFixes)
Get-Item $targetDoc | Select-Object FullName, Length, LastWriteTime
