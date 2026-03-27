// Configuración de Prisma 7 - CommonJS
module.exports = {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: 'postgresql://postgres:postgres@localhost:5433/finanzas',
  },
};
