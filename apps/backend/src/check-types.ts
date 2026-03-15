import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const transactions = await prisma.transaction.findMany({
    where: { isMeiInvoice: true },
    include: { category: true, account: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log('--- Ultimas 5 transacciones MEI ---');
  transactions.forEach(tx => {
    console.log(`ID: ${tx.id} | Desc: ${tx.description} | Type: ${tx.type} | Amount: ${tx.amount} | Date: ${tx.date}`);
  });
  
  await prisma.$disconnect();
}

main();
