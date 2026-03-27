# Script para detener el entorno de desarrollo de Finanzas
# Uso: .\stop-dev.ps1

Write-Host "🛑 Deteniendo entorno de desarrollo..." -ForegroundColor Yellow

# Detener contenedores Docker
Write-Host "`nDeteniendo PostgreSQL..." -ForegroundColor Yellow
docker compose down
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostgreSQL detenido" -ForegroundColor Green
} else {
    Write-Host "✗ Error al detener PostgreSQL" -ForegroundColor Red
}

# Detener procesos de Node.js (backend y frontend)
Write-Host "`nDeteniendo procesos de Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Procesos de Node.js detenidos" -ForegroundColor Green
} else {
    Write-Host "✓ No hay procesos de Node.js corriendo" -ForegroundColor Green
}

Write-Host "`n`n✅ Entorno de desarrollo detenido correctamente" -ForegroundColor Green
