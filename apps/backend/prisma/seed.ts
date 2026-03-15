// prisma/seed.ts
// Pobla la BD con datos iniciales: 2 usuarios, 2 cuentas y categorías globales.
// Ejecutar con: npx ts-node prisma/seed.ts
import 'dotenv/config';
import { PrismaClient, UserType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── 1. Usuarios
  const pablo = await prisma.user.upsert({
    where: { email: 'pablo@finanzas.app' },
    update: {},
    create: {
      name: 'Pablo',
      email: 'pablo@finanzas.app',
      type: UserType.PJ,
      meiAnnualLimit: 81000, // Límite MEI 2024 en BRL
    },
  });

  const rocio = await prisma.user.upsert({
    where: { email: 'rocio@finanzas.app' },
    update: {},
    create: {
      name: 'Rocío',
      email: 'rocio@finanzas.app',
      type: UserType.PF,
      meiAnnualLimit: null,
    },
  });

  console.log(`✅ Usuarios: ${pablo.name} (${pablo.type}), ${rocio.name} (${rocio.type})`);

  // ── 2. Cuentas
  await prisma.account.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: pablo.id,
      bankName: 'Santander',
      name: 'Corriente Santander PJ',
      balance: 0,
    },
  });

  await prisma.account.upsert({
    where: { id: 2 },
    update: {},
    create: {
      userId: rocio.id,
      bankName: 'Bradesco',
      name: 'Corriente Bradesco PF',
      balance: 0,
    },
  });

  console.log('✅ Cuentas creadas');

  // ── 3. Categorías globales por dominio
  const categorias = [
    { name: 'Alquiler', icon: '🏠', type: 'EXPENSE' },
    { name: 'Supermercado', icon: '🛒', type: 'EXPENSE' },
    { name: 'Luz', icon: '💡', type: 'EXPENSE' },
    { name: 'Gas', icon: '🔥', type: 'EXPENSE' },
    { name: 'Internet', icon: '🌐', type: 'EXPENSE' },
    { name: 'Salud', icon: '🏥', type: 'EXPENSE' },
    { name: 'Transporte', icon: '🚌', type: 'EXPENSE' },
    { name: 'Restaurantes', icon: '🍽️', type: 'EXPENSE' },
    { name: 'Entretenimiento', icon: '🎬', type: 'EXPENSE' },
    { name: 'Otros Gastos', icon: '📦', type: 'EXPENSE' },
    
    { name: 'Factura MEI Consultoría', icon: '📄', type: 'INCOME' },
    { name: 'Ingresos Freelance', icon: '💼', type: 'INCOME' },
    { name: 'Sueldo/Pró-labore', icon: '💰', type: 'INCOME' },
    
    { name: 'Compras Varias TC', icon: '💳', type: 'CREDIT_CARD' },
    { name: 'Suscripciones Digitales', icon: '📱', type: 'CREDIT_CARD' },
    { name: 'Viajes', icon: '✈️', type: 'CREDIT_CARD' },
  ];

  for (const cat of categorias) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { type: cat.type as any },
      create: {
        name: cat.name,
        icon: cat.icon,
        type: cat.type as any,
      },
    });
  }

  console.log(`✅ ${categorias.length} categorías globales creadas`);
  console.log('🌱 Seed completado con éxito');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
