import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const rows = await p.transaction.findMany({
  where: { creditCardId: { not: null } },
  select: { id: true, date: true, dueDate: true, creditCardId: true, status: true },
  take: 10,
});
console.log(JSON.stringify(rows, null, 2));
await p.$disconnect();
