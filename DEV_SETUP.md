# 🚀 Guía de Configuración del Entorno de Desarrollo

Esta guía te ayudará a levantar el entorno de desarrollo local de **Finanzas** de manera rápida y segura, sin afectar tu entorno de producción.

## 📋 Requisitos Previos

- **Docker** y **Docker Compose** instalados
- **Node.js** (v20.19+ o v22.12+ o v24.0+) y **npm**
  - ⚠️ Prisma requiere Node.js 20.19+, 22.12+, o 24.0+
- **Git**
- **Terminal**: PowerShell o Command Prompt (Windows) / Bash (Linux/Mac)

## 🏗️ Arquitectura del Proyecto

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

## ⚡ Inicio Rápido (Windows PowerShell)

### 1️⃣ Levantar Base de Datos
```powershell
docker compose up -d
```
Esto inicia PostgreSQL en `localhost:5433`.

### 2️⃣ Configurar Variables de Entorno del Backend
```powershell
Set-Content -Path ".env" -Value "DATABASE_URL=`"postgresql://postgres:postgres@localhost:5433/finanzas`"`nPORT=3000"
```

### 3️⃣ Ejecutar Migraciones y Generar Cliente Prisma
```powershell
npx prisma db push --schema=apps/backend/prisma/schema.prisma
```

**⚠️ Si obtienes un error `ERR_REQUIRE_ESM` con Prisma:**
```powershell
# Volver a la raíz del proyecto
cd ..

# Eliminar todo node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force apps\backend\node_modules
Remove-Item -Recurse -Force apps\web\node_modules
Remove-Item -Force package-lock.json

# Reinstalar con --legacy-peer-deps
npm install --legacy-peer-deps

# Volver a la raíz y ejecutar Prisma
npx prisma db push --schema=apps/backend/prisma/schema.prisma
```

### 4️⃣ Iniciar Backend (en una terminal)
```powershell
npm run dev
```
El backend estará disponible en `http://localhost:3000`

### 5️⃣ Iniciar Frontend (en otra terminal)
```powershell
cd ..\web
npm run dev
```
El frontend estará disponible en `http://localhost:3001`

## ⚡ Inicio Rápido (Linux/Mac Bash)

### 1️⃣ Levantar Base de Datos
```bash
docker compose up -d
```

### 2️⃣ Configurar Variables de Entorno del Backend
```bash
cd apps/backend
cat > .env << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/finanzas"
PORT=3000
EOF
```

### 3️⃣ Ejecutar Migraciones y Generar Cliente Prisma
```bash
npx prisma generate
npx prisma migrate dev
```

### 4️⃣ Iniciar Backend (en una terminal)
```bash
npm run dev
```

### 5️⃣ Iniciar Frontend (en otra terminal)
```bash
cd ../web
npm run dev
```

## 📝 Detalles de Cada Paso

### Paso 1: Base de Datos con Docker

El archivo [`docker-compose.yml`](docker-compose.yml) configura PostgreSQL para desarrollo:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: finanzas
```

**Comandos útiles (PowerShell):**
```powershell
# Ver logs de PostgreSQL
docker compose logs -f postgres

# Detener contenedores
docker compose down

# Eliminar datos (¡cuidado!)
docker compose down -v
```

**Comandos útiles (Bash):**
```bash
# Ver logs de PostgreSQL
docker compose logs -f postgres

# Detener contenedores
docker compose down

# Eliminar datos (¡cuidado!)
docker compose down -v
```

### Paso 2: Variables de Entorno

El backend requiere un archivo `.env` con la URL de la base de datos. Este archivo **NO debe subirse a Git** (ya está en [`.gitignore`](.gitignore)).

### Paso 3: Migraciones de Prisma

Prisma se encarga de la base de datos:

- `npx prisma generate` - Genera el cliente TypeScript de Prisma
- `npx prisma migrate dev` - Aplica migraciones pendientes
- `npx prisma studio` - Interfaz visual para explorar la BD (opcional)

### Paso 4: Backend (NestJS)

El backend usa [`dotenv-cli`](apps/backend/package.json:35) para cargar variables de entorno:

```json
"scripts": {
  "dev": "dotenv -e .env -- nest start --watch"
}
```

**Endpoints disponibles:**
- `GET /accounts` - Listar cuentas
- `GET /categories` - Listar categorías
- `GET /transactions` - Listar transacciones
- `POST /transactions/expense` - Crear gasto
- `POST /transactions/income` - Crear ingreso
- `POST /transactions/mei-invoice` - Procesar factura MEI

### Paso 5: Frontend (Next.js)

El frontend usa [`apiFetch`](apps/web/src/lib/api.ts) para comunicarse con el backend.

**Páginas disponibles:**
- `/` - Dashboard principal
- `/transactions` - Gestión de transacciones
- `/cards` - Tarjetas de crédito
- `/incomes` - Ingresos
- `/mei` - Gestión MEI
- `/settings` - Configuración

## 🔒 Seguridad y Separación de Entornos

### Entorno de Desarrollo vs Producción

| Aspecto | Desarrollo | Producción |
|---------|------------|------------|
| Base de datos | Local Docker (5433) | Docker en servidor |
| Código fuente | Local, sin commits | Solo desde `main` |
| Variables de entorno | Archivo `.env` local | GitHub Secrets |
| Deploy | Manual | Automático en push a `main` |
| Afectación a producción | ❌ Ninguna | ✅ Solo en `main` |

### CI/CD Pipeline

El pipeline de despliegue (`.github/workflows/deploy.yml`) **solo se ejecuta** cuando haces push a la rama `main`:

```yaml
on:
  push:
    branches:
      - main
```

Esto significa que puedes trabajar en desarrollo, hacer commits, y **nada se desplegará** hasta que hagas merge a `main`.

## 🛠️ Solución de Problemas

### Error: "Connection refused" en PostgreSQL
```bash
# Verificar que el contenedor está corriendo
docker compose ps

# Reiniciar contenedor
docker compose restart postgres
```

### Error: "Prisma Client not generated"
```bash
cd apps/backend
npx prisma generate
```

### Error: "Module not found"
```bash
# Instalar dependencias del proyecto
npm install

# O instalar dependencias específicas
cd apps/backend && npm install
cd ../web && npm install
```

### Error: TypeScript compilation failed
Los errores de TypeScript ya han sido solucionados en:
- [`apps/backend/tsconfig.json`](apps/backend/tsconfig.json) - `isolatedModules: false`
- [`apps/web/src/components/transactions/ExpenseFormModal.tsx`](apps/web/src/components/transactions/ExpenseFormModal.tsx) - Tipos `string | null`
- [`apps/web/src/components/transactions/IncomeFormModal.tsx`](apps/web/src/components/transactions/IncomeFormModal.tsx) - Tipos `string | null`

Si encuentras nuevos errores, verifica que:
1. Las dependencias están instaladas
2. El cliente de Prisma está generado
3. Las variables de entorno están configuradas

## 📚 Comandos Útiles

### Backend
```bash
cd apps/backend

# Desarrollo con hot-reload
npm run dev

# Compilar para producción
npm run build

# Ejecutar tests
npm test

# Formatear código
npm run format

# Linter
npm run lint
```

### Frontend
```bash
cd apps/web

# Desarrollo con hot-reload
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm start

# Linter
npm run lint
```

### Docker
```bash
# Iniciar contenedores
docker compose up -d

# Ver logs
docker compose logs -f

# Detener contenedores
docker compose down

# Verificar estado
docker compose ps
```

## 🎯 Flujo de Trabajo Recomendado

1. **Crear rama de feature** (opcional pero recomendado):
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. **Levantar entorno de desarrollo** (siguiendo esta guía)

3. **Desarrollar y probar localmente**

4. **Hacer commits** (no afectan producción):
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin feature/nueva-funcionalidad
   ```

5. **Crear Pull Request** y hacer merge a `main` cuando esté listo

6. **El CI/CD desplegará automáticamente** a producción

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Docker: `docker compose logs`
2. Verifica que los puertos no estén en uso
3. Asegúrate de tener las versiones correctas de Node.js y Docker
4. Consulta la documentación oficial de [NestJS](https://docs.nestjs.com) y [Next.js](https://nextjs.org/docs)

---

**¡Listo!** Tu entorno de desarrollo debería estar funcionando correctamente. 🎉
