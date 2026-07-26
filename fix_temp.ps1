$path = "D:\B_XM\cloud_photo\cloud_photo\src\app\income\page.tsx"
$content = Get-Content -Path $path -Raw

$content = $content -replace "<span className=""text-gray-500 text-xs"">\{industryFilter \|\| '全部'\}</span>\r?\n", ""
$content = $content -replace 'title="筛选行业"', "title={industryFilter || '筛选行业'}"

Set-Content -Path $path -Value $content -Encoding utf8
