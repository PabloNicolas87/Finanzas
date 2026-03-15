import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const accounts = await prisma.account.findMany({ include: { user: true } });
    const categories = await prisma.category.findMany();
    
    console.log('--- ACCOUNTS ---');
    accounts.forEach(a => {
      console.log(`ID: ${a.id} | Name: ${a.name} | User: ${a.user.name} (${a.user.type})`);
    });
    
    console.log('\n--- CATEGORIES ---');
    categories.forEach(c => {
      console.log(`ID: ${c.id} | Name: ${c.name}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
