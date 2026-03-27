# 🚀 Finanzas - Entorno de Desarrollo

Guía rápida para levantar el entorno de desarrollo local.

## ⚡ Inicio Rápido (2 comandos)

### Levantar todo el entorno:
```powershell
.\start-dev.ps1
```

### Detener todo el entorno:
```powershell
.\stop-dev.ps1
```

> **Nota**: El script crea automáticamente el archivo `.env` si no existe. Para configuración personalizada, copia [`.env.example`](.env.example) a `.env` y ajusta los valores.

## 📋 Requisitos

- **Docker** y **Docker Compose** instalados
- **Node.js** (v20.19+ o v22.12+ o v24.0+) y **npm**
- **PowerShell** (Windows)

## 🏗️ Arquitectura

```
Finanzas/
├── apps/
│   ├── backend/     # NestJS API (puerto 3000)
│   ├── web/         # Next.js Frontend (puerto 3001)
│   └── mobile/      # React Native (opcional)
├── packages/
│   └── shared-types/ # Tipos compartidos
├── docker-compose.yml        # PostgreSQL para desarrollo
└── docker-compose.prod.yml   # Contenedores completos para producción
```

## 🎯 Servicios

| Servicio | URL | Descripción |
|----------|------|-------------|
| Frontend | http://localhost:3001 | Next.js App |
| Backend | http://localhost:3000 | NestJS API |
| Database | localhost:5433 | PostgreSQL |

## 📝 Pasos Manuales (si prefieres no usar el script)

### 1. Levantar PostgreSQL
```powershell
docker compose up -d
```

### 2. Configurar base de datos
```powershell
npx prisma db push --schema=apps/backend/prisma/schema.prisma
```

### 3. Iniciar Backend (en una terminal)
```powershell
cd apps\backend
npm run dev
```

### 4. Iniciar Frontend (en otra terminal)
```powershell
cd apps\web
npm run dev
```

## 🔧 Solución de Problemas

### Error: Docker no está disponible
Asegúrate de que Docker Desktop esté corriendo.

### Error: Node.js versión incompatible
Prisma requiere Node.js 20.19+, 22.12+, o 24.0+. Actualiza Node.js desde https://nodejs.org/

### Error: ERR_REQUIRE_ESM con Prisma
```powershell
# Reinstalar dependencias
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install --legacy-peer-deps
```

### Error: La base de datos no se conecta
```powershell
# Verificar que PostgreSQL esté corriendo
docker compose ps

# Ver logs
docker compose logs postgres
```

## 🔒 Seguridad

Tu entorno de desarrollo **no afecta la producción** porque:
- El CI/CD solo se ejecuta en la rama `main`
- Desarrollo usa [`docker-compose.yml`](docker-compose.yml) (solo PostgreSQL)
- Producción usa [`docker-compose.prod.yml`](docker-compose.prod.yml) (contenedores completos)
- Las variables de entorno están separadas

## 📚 Documentación Adicional

Para más detalles, consulta [`DEV_SETUP.md`](DEV_SETUP.md).

## 🎉 ¡Listo!

Después de ejecutar `.\start-dev.ps1`, tendrás:
- ✅ PostgreSQL corriendo en `localhost:5433`
- ✅ Backend corriendo en `http://localhost:3000`
- ✅ Frontend corriendo en `http://localhost:3001`

Abre tu navegador en **http://localhost:3001** para ver la aplicación.
