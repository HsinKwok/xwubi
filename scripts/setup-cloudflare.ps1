# One-time Cloudflare resource setup for xwubi.
# Requires an API token with these account permissions:
#   Workers Scripts:Edit, D1:Edit, Workers KV Storage:Edit, Workers R2 Storage:Edit, Account Settings:Read
#
#   $env:CLOUDFLARE_API_TOKEN = "..."
#   $env:CLOUDFLARE_ACCOUNT_ID = "..."   # optional when the token only sees one account
#   powershell -ExecutionPolicy Bypass -File scripts/setup-cloudflare.ps1
param(
  [string]$DatabaseName = 'xwubi',
  [string]$KvName = 'CACHE',
  [string]$BucketName = 'xwubi-media'
)

$ErrorActionPreference = 'Stop'

if (-not $env:CLOUDFLARE_API_TOKEN) {
  Write-Warning 'CLOUDFLARE_API_TOKEN is not set; falling back to the logged-in wrangler session.'
}

Write-Host '==> Creating D1 database' -ForegroundColor Cyan
npx wrangler d1 create $DatabaseName

Write-Host '==> Creating KV namespace' -ForegroundColor Cyan
npx wrangler kv namespace create $KvName

Write-Host '==> Creating R2 bucket' -ForegroundColor Cyan
npx wrangler r2 bucket create $BucketName

Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Green
Write-Host '  1. Copy the returned database_id into wrangler.toml [[d1_databases]]'
Write-Host '  2. Copy the returned KV id into wrangler.toml [[kv_namespaces]]'
Write-Host '  3. Optional: configure SMTP later in Admin > Settings > Mail Service'
Write-Host '  4. Deploy: powershell -ExecutionPolicy Bypass -File scripts/deploy-remote.ps1'
