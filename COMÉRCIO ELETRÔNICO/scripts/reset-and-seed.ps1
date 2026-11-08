[CmdletBinding()]
param(
  [switch]$ConfirmReset
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$backendEnvPath = Join-Path $repoRoot 'backend\.env'

if (-not $ConfirmReset) {
  throw 'O reset foi bloqueado. Execute com -ConfirmReset e confirme a frase solicitada.'
}

$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
  if (-not (Test-Path $backendEnvPath)) {
    throw 'Defina DATABASE_URL ou configure backend/.env para seleccionar o banco.'
  }
  $envContent = Get-Content -Raw $backendEnvPath
  $match = [regex]::Match($envContent, '(?m)^\s*DATABASE_URL\s*=\s*(.+?)\s*$')
  if (-not $match.Success) {
    throw 'DATABASE_URL não está configurada em backend/.env.'
  }
  $databaseUrl = $match.Groups[1].Value.Trim().Trim('"').Trim("'")
}

try {
  $databaseUri = [System.Uri]::new($databaseUrl)
} catch {
  throw 'DATABASE_URL não é uma URL válida; o reset foi bloqueado.'
}

$localHosts = @('localhost', '127.0.0.1', '::1')
if ($databaseUri.Scheme -notin @('postgresql', 'postgres') -or $databaseUri.DnsSafeHost -notin $localHosts) {
  throw 'O reset só é permitido para PostgreSQL local (localhost, 127.0.0.1 ou ::1).'
}

Write-Host "Banco local seleccionado: $($databaseUri.DnsSafeHost)$($databaseUri.AbsolutePath)"
Write-Host 'ATENÇÃO: esta operação apaga todos os dados e reaplica as migrations.'
$confirmation = Read-Host 'Escreva APAGAR DADOS LOCAIS para continuar'
if ($confirmation -cne 'APAGAR DADOS LOCAIS') {
  throw 'Confirmação incorrecta; nenhuma alteração foi feita.'
}

$databaseUrlAnterior = $env:DATABASE_URL
$env:DATABASE_URL = $databaseUrl

Push-Location $repoRoot
try {
  npm run db:reset -w backend
  if ($LASTEXITCODE -ne 0) {
    throw 'Prisma migrate reset falhou.'
  }

  npm run db:seed -w backend
  if ($LASTEXITCODE -ne 0) {
    throw 'O reset terminou, mas o seed falhou; verifique a saída acima.'
  }

  Write-Host 'Reset e seed concluídos com sucesso.'
} finally {
  Pop-Location
  if ($null -eq $databaseUrlAnterior) {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:DATABASE_URL = $databaseUrlAnterior
  }
}
