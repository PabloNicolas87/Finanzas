const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function run() {
  const txs = await prisma.transaction.findMany({ 
    where: { 
      creditCardId: { not: null }, 
      creditCardGroupId: null 
    } 
  });
  
  let updatedCount = 0;
  for (const tx of txs) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { creditCardGroupId: uuidv4() }
    });
    updatedCount++;
  }
  
  console.log(`Updated ${updatedCount} legacy CC transactions.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
