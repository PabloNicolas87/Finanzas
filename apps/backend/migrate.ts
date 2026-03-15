import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: {
      creditCardId: { not: null },
      creditCardGroupId: null
    }
  });

  console.log(`Found ${txs.length} legacy CC transactions to migrate`);

  for (const tx of txs) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { creditCardGroupId: uuidv4() }
    });
  }

  console.log(`Migration complete`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
