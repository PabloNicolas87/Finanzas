import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Le decimos a Prisma qué comando ejecutar para sembrar:
    seed: 'node dist/prisma/seed.js',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});

