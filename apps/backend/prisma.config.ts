// prisma.config.ts — Configuración de Prisma 7
// En Prisma 7, la URL de conexión se define aquí (no en schema.prisma).
// Las migraciones funcionan automáticamente con solo `datasource.url`.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    url: env('DATABASE_URL'),
  },
});

