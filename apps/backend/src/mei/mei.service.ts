import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, TransactionStatus, MeiInvoiceType } from '@prisma/client';

@Injectable()
export class MeiService {
  constructor(private prisma: PrismaService) {}

  async createInternalTransfer(data: {
    amount: number;
    date: Date;
    description?: string;
  }) {
    // Look up accounts and category dynamically
    const fromAccount = await this.prisma.account.findFirstOrThrow({
      where: { user: { type: 'PF' } }, // Rocío
      include: { user: true }
    });
    
    const toAccount = await this.prisma.account.findFirstOrThrow({
      where: { user: { type: 'PJ' } }, // Pablo
      include: { user: true }
    });

    const category = await this.prisma.category.findFirstOrThrow({
      where: { name: 'Factura MEI Consultoría' }
    });

    const FROM_ACCOUNT_ID = fromAccount.id;
    const TO_ACCOUNT_ID = toAccount.id;
    const CATEGORY_ID_MEI = category.id;

    return this.prisma.$transaction(async (tx) => {
      // 1. Withdraw from PF Rocío (TRANSFER)
      const withdrawal = await tx.transaction.create({
        data: {
          accountId: FROM_ACCOUNT_ID,
          toAccountId: TO_ACCOUNT_ID,
          categoryId: CATEGORY_ID_MEI,
          amount: data.amount,
          type: TransactionType.TRANSFER,
          status: TransactionStatus.PAID,
          description: data.description || 'Transferencia Consultoría MEI (R -> P)',
          date: data.date,
          isMeiInvoice: false,
        },
      });

      // 2. Deposit to PJ Pablo (TRANSFER + MEI)
      const deposit = await tx.transaction.create({
        data: {
          accountId: TO_ACCOUNT_ID,
          categoryId: CATEGORY_ID_MEI,
          amount: data.amount,
          type: TransactionType.TRANSFER,
          status: TransactionStatus.PAID,
          description: data.description || 'Consultoría MEI Recibida (R -> P)',
          date: data.date,
          isMeiInvoice: true,
          meiInvoiceType: MeiInvoiceType.INTERNAL_PENDING,
          meiInvoiceGroupId: withdrawal.id.toString(),
        },
      });

      // 3. Update Balances
      await tx.account.update({
        where: { id: FROM_ACCOUNT_ID },
        data: { balance: { decrement: data.amount } },
      });

      await tx.account.update({
        where: { id: TO_ACCOUNT_ID },
        data: { balance: { increment: data.amount } },
      });

      return { withdrawal, deposit };
    });
  }
}
