$ErrorActionPreference = 'Stop'

$sourceDoc = if ($args.Count -gt 0 -and $args[0]) { $args[0] } else { 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\Bao_cao_website_cho_nong_san_hoan_thien_theo_web.docx' }
$targetDoc = if ($args.Count -gt 1 -and $args[1]) { $args[1] } else { 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\Bao_cao_website_cho_nong_san_hoan_thien_theo_web_fix.docx' }

Copy-Item $sourceDoc $targetDoc -Force

$cp1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8 = [System.Text.UTF8Encoding]::new($false)

$c2 = [char]0x00C2
$c3 = [char]0x00C3
$c4 = [char]0x00C4
$c6 = [char]0x00C6

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
    $stream = $entry.Open()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8)
    $xml = $reader.ReadToEnd()
    $reader.Dispose()

    $script:fixedInFile = 0
    $updated = [System.Text.RegularExpressions.Regex]::Replace(
        $xml,
        '<w:t([^>]*)>(.*?)</w:t>',
        {
            param($m)
            $attrs = $m.Groups[1].Value
            $inner = $m.Groups[2].Value
            $decoded = [System.Net.WebUtility]::HtmlDecode($inner)
            if (-not (Test-Mojibake $decoded)) {
                return $m.Value
            }
            $repaired = Repair-Text $decoded
            if ($repaired -eq $decoded) {
                return $m.Value
            }
            $script:fixedInFile++
            $escaped = [System.Security.SecurityElement]::Escape($repaired)
            return "<w:t$attrs>$escaped</w:t>"
        },
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    if ($script:fixedInFile -gt 0) {
        $totalFixes += $script:fixedInFile
        $entry.Delete()
        $newEntry = $zip.CreateEntry($entry.FullName)
        $writer = [System.IO.StreamWriter]::new($newEntry.Open(), $utf8)
        $writer.Write($updated)
        $writer.Dispose()
    }
}

$zip.Dispose()

Write-Output ("Fixed text nodes: {0}" -f $totalFixes)
Get-Item $targetDoc | Select-Object FullName, Length, LastWriteTime
