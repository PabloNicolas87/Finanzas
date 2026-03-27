# Script para levantar el entorno de desarrollo de Finanzas
# Uso: .\start-dev.ps1

Write-Host "Iniciando entorno de desarrollo de Finanzas..." -ForegroundColor Cyan

# Paso 1: Verificar Docker
Write-Host "`n[1/6] Verificando Docker..." -ForegroundColor Yellow
try {
    docker compose ps | Out-Null
    Write-Host "[OK] Docker esta disponible" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker no esta disponible" -ForegroundColor Red
    exit 1
}

# Paso 2: Levantar PostgreSQL
Write-Host "`n[2/6] Levantando PostgreSQL..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] PostgreSQL iniciado en localhost:5433" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error al iniciar PostgreSQL" -ForegroundColor Red
    exit 1
}

# Paso 3: Verificar Node.js
Write-Host "`n[3/6] Verificando version de Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "[OK] Node.js version: $nodeVersion" -ForegroundColor Green

# Verificar si la version es compatible con Prisma
if ($nodeVersion -match "v20\.1[1-8]\.") {
    Write-Host "[ADVERTENCIA] Node.js $nodeVersion puede no ser compatible con Prisma" -ForegroundColor Yellow
    Write-Host "  Se recomienda Node.js 20.19+ o 22.x" -ForegroundColor Yellow
}

# Paso 4: Ejecutar Prisma
Write-Host "`n[4/6] Configurando base de datos con Prisma..." -ForegroundColor Yellow
$originalPath = Get-Location
Set-Location apps\backend
npx prisma db push
Set-Location $originalPath
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Base de datos configurada correctamente" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error al configurar la base de datos" -ForegroundColor Red
    exit 1
}

# Paso 4b: Generar cliente Prisma
Write-Host "`n[4b/6] Generando cliente Prisma..." -ForegroundColor Yellow
$originalPath = Get-Location
Set-Location apps\backend
npx prisma generate
Set-Location $originalPath
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Cliente Prisma generado correctamente" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error al generar el cliente Prisma" -ForegroundColor Red
    exit 1
}

# Paso 6: Iniciar Backend
Write-Host "`n[6/7] Iniciando Backend (NestJS)..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "apps\backend" -PassThru -NoNewWindow
Start-Sleep -Seconds 3
if (!$backendProcess.HasExited) {
    Write-Host "[OK] Backend iniciado en http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error al iniciar el backend" -ForegroundColor Red
    exit 1
}

# Paso 7: Iniciar Frontend
Write-Host "`n[7/7] Iniciando Frontend (Next.js)..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "apps\web" -PassThru -NoNewWindow
Start-Sleep -Seconds 3
if (!$frontendProcess.HasExited) {
    Write-Host "[OK] Frontend iniciado en http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error al iniciar el frontend" -ForegroundColor Red
    exit 1
}

# Resumen
Write-Host "`n`nEntorno de desarrollo iniciado correctamente!" -ForegroundColor Green
Write-Host "`nServicios disponibles:" -ForegroundColor Cyan
Write-Host "  * Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "  * Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "  * Database: localhost:5433" -ForegroundColor White
Write-Host "`nPresiona Ctrl+C para detener todos los servicios" -ForegroundColor Yellow

# Esperar a que el usuario presione Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`n`nDeteniendo servicios..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Servicios detenidos" -ForegroundColor Green
}
