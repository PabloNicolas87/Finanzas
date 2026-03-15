import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';

@Injectable()
export class CreditCardsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createCreditCardDto: CreateCreditCardDto) {
    return this.prisma.creditCard.create({
      data: createCreditCardDto,
    });
  }

  findAll() {
    return this.prisma.creditCard.findMany();
  }

  async findOne(id: number) {
    const card = await this.prisma.creditCard.findUnique({
      where: { id },
    });
    if (!card) {
      throw new NotFoundException(`CreditCard with ID ${id} not found`);
    }
    return card;
  }

  update(id: number, updateCreditCardDto: UpdateCreditCardDto) {
    return this.prisma.creditCard.update({
      where: { id },
      data: updateCreditCardDto,
    });
  }

  remove(id: number) {
    return this.prisma.creditCard.delete({
      where: { id },
    });
  }

  async getStatement(id: number, month: number, year: number) {
    const dateFrom = new Date(year, month, 1);
    const dateTo = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        creditCardId: id,
        dueDate: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      transactions,
      totalAmount,
    };
  }

  /**
   * Domain-Driven Design: Calculamos el statement de una tarjeta basada en las compras que vencen ese mes
   * y realizamos un upsert sobre CreditCardStatement.
   */
  async calculateMonthlyStatement(cardId: number, month: number, year: number) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    const card = await this.prisma.creditCard.findUniqueOrThrow({
      where: { id: cardId },
    });

    const txs = await this.prisma.transaction.findMany({
      where: {
        creditCardId: cardId,
        dueDate: {
          gte: start,
          lte: end,
        },
      },
    });

    // We only create an upsert if there's actually a transaction for it, although an empty 0 statement is also possible.
    // If no txs, maybe amount is 0.
    const totalAmount = txs.reduce((s, t) => s + Number(t.amount), 0);
    const dueDate = new Date(year, month, card.dueDay);

    const existing = await this.prisma.creditCardStatement.findUnique({
      where: {
        creditCardId_month_year: {
          creditCardId: cardId,
          month,
          year,
        },
      },
    });

    return this.prisma.creditCardStatement.upsert({
      where: {
        creditCardId_month_year: {
          creditCardId: cardId,
          month,
          year,
        },
      },
      create: {
        creditCardId: cardId,
        month,
        year,
        totalAmount,
        dueDate,
        status: 'PENDING',
      },
      update: {
        totalAmount,
        dueDate,
        // Only update status if not already PAID
        ...(existing?.status !== 'PAID' ? {} : {}), // It always stays as previous status unless explicitly changed by user
      },
    });
  }

  /**
   * Atómico: actualiza únicamente el estado de pago del Resumen Mensual consolidado.
   */
  async updateStatementStatus(id: number, status: TransactionStatus) {
    return this.prisma.creditCardStatement.update({
      where: { id },
      data: { status },
    });
  }
}
