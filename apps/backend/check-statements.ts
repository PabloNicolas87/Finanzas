import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const statements = await prisma.creditCardStatement.findMany({
    include: { creditCard: true }
  });
  console.log('--- Credit Card Statements ---');
  console.log(JSON.stringify(statements, null, 2));
  
  const transactions = await prisma.transaction.findMany({
    where: { creditCardId: { not: null } },
    take: 5
  });
  console.log('\n--- Recent Credit Card Transactions ---');
  console.log(JSON.stringify(transactions, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
