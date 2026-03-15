import { PrismaClient, TransactionType, MeiInvoiceType } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  console.log('--- Iniciando migración de tipos de transacción ---');
  
  // 1. Actualizar transacciones de ingreso marcadas como INTERNAL_PENDING a TRANSFER
  const updatedIncomes = await prisma.transaction.updateMany({
    where: {
      type: TransactionType.INCOME,
      meiInvoiceType: MeiInvoiceType.INTERNAL_PENDING
    },
    data: {
      type: TransactionType.TRANSFER
    }
  });
  console.log(`Actualizadas ${updatedIncomes.count} transacciones de INCOME a TRANSFER.`);

  // 2. Actualizar transacciones de gasto vinculadas a Consultoría MEI a TRANSFER
  // Buscamos por la categoría "Factura MEI Consultoría" que sean de tipo EXPENSE
  const categoryMei = await prisma.category.findFirst({
    where: { name: 'Factura MEI Consultoría' }
  });

  if (categoryMei) {
    const updatedExpenses = await prisma.transaction.updateMany({
      where: {
        type: TransactionType.EXPENSE,
        categoryId: categoryMei.id
      },
      data: {
        type: TransactionType.TRANSFER
      }
    });
    console.log(`Actualizadas ${updatedExpenses.count} transacciones de EXPENSE a TRANSFER.`);
  }

  console.log('--- Migración completada ---');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error durante la migración:', err);
  process.exit(1);
});
