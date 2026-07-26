$path = "D:\B_XM\cloud_photo\cloud_photo\src\app\income\page.tsx"
$lines = Get-Content -Path $path
$result = @()
foreach ($line in $lines) {
    # Fix the SVG line that has 32 spaces indentation - reduce to 16
    if ($line -match '^                                <svg') {
        $line = $line.TrimStart()
        $result += '                ' + $line
    } else {
        $result += $line
    }
}
$result | Set-Content -Path $path -Encoding utf8
