const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const accounts = await prisma.account.findMany();
  const txs = await prisma.transaction.findMany({ 
    where: { isMeiInvoice: true }, 
    include: { account: true }, 
    orderBy: { id: 'desc' },
    take: 10
  });

  console.log(JSON.stringify({ 
    users: users.map(u => ({ id: u.id, name: u.name })), 
    accounts: accounts.map(a => ({ id: a.id, name: a.name, userId: a.userId })), 
    meiTransactions: txs.map(t => ({ id: t.id, amount: t.amount, accountId: t.accountId, userId: t.account.userId, date: t.date }))
  }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
