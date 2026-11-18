# Build, migrate the remote D1 database, optionally import seeds, then deploy.
#
#   powershell -ExecutionPolicy Bypass -File scripts/deploy-remote.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/deploy-remote.ps1 -WithSeed -SiteOrigin https://xwubi.example.workers.dev
#
# Notes:
#   - seeds/ is git-ignored, so -WithSeed only works on a machine that has the data locally.
#   - The API token (or a wrangler login session) must belong to the target account.
param(
  [switch]$WithSeed,
  [switch]$SkipBuild,
  [string]$SiteOrigin = 'https://xwubi.hsinkwok.workers.dev'
)

$ErrorActionPreference = 'Stop'

function Invoke-Wrangler {
  param([string[]]$WranglerArgs)
  npx wrangler @WranglerArgs
  if ($LASTEXITCODE -ne 0) {
    throw "wrangler $($WranglerArgs -join ' ') failed with exit code $LASTEXITCODE"
  }
}

if (-not (Test-Path 'wrangler.toml')) { throw 'Run this script from the repository root.' }

$toml = Get-Content -Raw 'wrangler.toml'
if ($toml -match '00000000000000000000000000000001' -or $toml -match '00000000000000000000000000000002') {
  throw 'wrangler.toml still contains placeholder D1/KV ids. Run scripts/setup-cloudflare.ps1 first.'
}

if ($WithSeed -and -not (Test-Path 'seeds/dev.sql')) {
  throw '-WithSeed was given but seeds/dev.sql is missing (seeds/ is not tracked in git).'
}

if (-not $SkipBuild) {
  Write-Host '==> Building assets' -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'npm run build failed' }
}

Write-Host '==> Applying D1 migrations (remote)' -ForegroundColor Cyan
Invoke-Wrangler @('d1', 'migrations', 'apply', 'xwubi', '--remote')

if ($WithSeed) {
  Write-Host '==> Importing seeds/dev.sql' -ForegroundColor Cyan
  Invoke-Wrangler @('d1', 'execute', 'xwubi', '--remote', '--file=seeds/dev.sql')

  Get-ChildItem 'seeds/content' -Filter '*.sql' | Sort-Object Name | ForEach-Object {
    Write-Host "==> Importing seeds/content/$($_.Name)" -ForegroundColor Cyan
    Invoke-Wrangler @('d1', 'execute', 'xwubi', '--remote', "--file=$($_.FullName)")
  }
}

Write-Host '==> Deploying worker' -ForegroundColor Cyan
$deployArgs = @('deploy', '--var', 'ENVIRONMENT:production')
if ($SiteOrigin) { $deployArgs += @('--var', "SITE_ORIGIN:$SiteOrigin") }
Invoke-Wrangler $deployArgs

Write-Host ''
Write-Host 'Deployed.' -ForegroundColor Green
Write-Host 'If email features are needed, set the secret once: npx wrangler secret put RESEND_API_KEY'
