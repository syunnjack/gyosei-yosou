# gyosei-yosou.jp への反映を、ドライラン → 確認 → 本番 の順に実行する。
# ユーザー名とパスワードはこの画面で入力する。ファイルや履歴には残さない（このプロセスの環境変数にだけ置く）。
# 出力は wordpress/tools/publish.log にも残す（資格情報は書かれない）。
$ErrorActionPreference = 'Continue'
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'
$script = Join-Path $PSScriptRoot 'publish_2026_results.py'
$log = Join-Path $PSScriptRoot 'publish.log'
"=== $(Get-Date -Format s) start ===" | Out-File $log -Encoding utf8

$env:WPU = Read-Host 'WordPress のユーザー名'
$sec = Read-Host 'WordPress のパスワード' -AsSecureString
$env:WPP = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))

try {
    Write-Host "`n=== ドライラン（まだ何も書き込みません） ===" -ForegroundColor Cyan
    python $script 2>&1 | ForEach-Object { "$_"; "$_" | Out-File $log -Append -Encoding utf8 }
    if ($LASTEXITCODE -ne 0) { Write-Host "ドライランが失敗しました（終了コード $LASTEXITCODE）。publish.log を Claude に見せてください。" -ForegroundColor Red; return }

    $ans = Read-Host "`nこの内容でブログに反映しますか？ (y/N)"
    "answer: $ans" | Out-File $log -Append -Encoding utf8
    if ($ans -eq 'y') {
        Write-Host "`n=== 反映 ===" -ForegroundColor Cyan
        python $script --apply 2>&1 | ForEach-Object { "$_"; "$_" | Out-File $log -Append -Encoding utf8 }
    } else {
        Write-Host '反映しませんでした。'
    }
} finally {
    Remove-Item Env:WPU, Env:WPP -ErrorAction SilentlyContinue
    "=== $(Get-Date -Format s) end ===" | Out-File $log -Append -Encoding utf8
}
