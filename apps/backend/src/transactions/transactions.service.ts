// src/transactions/transactions.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, TransactionStatus, MeiInvoiceType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CreditCardsService } from '../credit-cards/credit-cards.service';

export interface CreateExpenseDto {
  accountId: number;
  categoryId: number;
  amount: number;
  description?: string;
  date?: Date;
  creditCardId?: number;
  totalInstallments?: number;
}

export interface CreateIncomeDto {
  accountId: number;
  categoryId: number;
  amount: number;
  description?: string;
  date?: Date;
  isMeiInvoice?: boolean;
  meiInvoiceType?: MeiInvoiceType;
}

export interface UpdateTransactionDto {
  accountId?: number;
  categoryId?: number;
  amount?: number;
  description?: string;
  date?: Date;
  isMeiInvoice?: boolean;
}

export interface ProcessMeiInvoiceDto {
  /** Cuenta de Rocío (PF) — se descontará el importe */
  fromAccountId: number;
  /** Cuenta de Pablo (PJ - MEI) — recibirá el importe marcado como isMeiInvoice */
  toAccountId: number;
  /** Categoría del gasto (Ej: "Factura MEI Consultoría") */
  categoryId: number;
  amount: number;
  description?: string;
  date?: Date;
}

export interface TransactionFilters {
  accountId?: number;
  categoryId?: number;
  type?: TransactionType;
  dateFrom?: Date;
  dateTo?: Date;
  isMeiInvoice?: boolean;
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditCardsService: CreditCardsService,
  ) { }

  // ─────────────────────────────────────────────────────────────
  //  CREAR EGRESO
  // ─────────────────────────────────────────────────────────────

  /**
   * Crea uno o múltiples EXPENSEs (si hay cuotas) y descuenta el saldo de la cuenta si aplica.
   */
  async createExpense(dto: CreateExpenseDto) {
    const installments = dto.totalInstallments && dto.totalInstallments > 1 ? dto.totalInstallments : 1;
    const amountPerInstallment = dto.amount / installments;
    const startDate = dto.date ? new Date(dto.date) : new Date();

    // Verificar saldo suficiente si no es una compra con tarjeta
    let creditCard: any = null;
    if (!dto.creditCardId) {
      const account = await this.prisma.account.findUniqueOrThrow({
        where: { id: dto.accountId },
      });
      if (Number(account.balance) < dto.amount) {
        throw new BadRequestException(
          `Saldo insuficiente. Disponible: ${account.balance} BRL`,
        );
      }
    } else {
      creditCard = await this.prisma.creditCard.findUniqueOrThrow({
        where: { id: dto.creditCardId },
      });
    }

    const operations: any[] = [];
    
    let creditCardGroupId: string | undefined;
    let firstDueDate = new Date(startDate);
    if (creditCard) {
      creditCardGroupId = uuidv4();
      const purchaseDay = startDate.getDate();
      const currentMonth = startDate.getMonth();
      const currentYear = startDate.getFullYear();
      
      if (purchaseDay >= creditCard.closingDay) {
        // Pasa para el próximo mes
        firstDueDate = new Date(currentYear, currentMonth + 1, creditCard.dueDay);
      } else {
        // Se paga en el mes actual
        firstDueDate = new Date(currentYear, currentMonth, creditCard.dueDay);
      }
    }

    for (let i = 0; i < installments; i++) {
      // Increment month for each installment (generation date)
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);

      // Increment month for dueDate
      const currentDueDate = new Date(firstDueDate);
      currentDueDate.setMonth(currentDueDate.getMonth() + i);

      operations.push(
        this.prisma.transaction.create({
          data: {
            accountId: dto.accountId,
            categoryId: dto.categoryId,
            amount: amountPerInstallment,
            type: TransactionType.EXPENSE,
            description: dto.description,
            date: installmentDate,
            dueDate: currentDueDate, // Dynamic calculated due date
            isMeiInvoice: false,
            creditCardId: dto.creditCardId,
            installmentNumber: installments > 1 ? i + 1 : null,
            totalInstallments: installments > 1 ? installments : null,
            creditCardGroupId: creditCardGroupId,
            purchaseDate: creditCard ? startDate : null,
          },
          include: { account: true, category: true },
        })
      );
    }

    // Si no es compra con tarjeta, se descuenta el balance de la cuenta bancaria.
    // (Si es con tarjeta de crédito, el usuario luego crea otra tx para pagar la tarjeta)
    if (!dto.creditCardId) {
      operations.push(
        this.prisma.account.update({
          where: { id: dto.accountId },
          data: { balance: { decrement: dto.amount } },
        })
      );
    }

    const results = await this.prisma.$transaction(operations);

    // Filter out the account update result if it exists.
    const createdTransactions = dto.creditCardId ? results : results.slice(0, -1);
    
    return createdTransactions.length === 1 ? createdTransactions[0] : createdTransactions;
  }

  /**
   * Actualiza el status de PENDING a PAID o viceversa.
   */
  async updateStatus(id: number, status: TransactionStatus) {
    return this.prisma.transaction.update({
      where: { id },
      data: { status },
    });
  }


  // ─────────────────────────────────────────────────────────────
  //  CREAR INGRESO
  // ─────────────────────────────────────────────────────────────

  /**
   * Crea un INCOME y suma el saldo de la cuenta, en una operación atómica.
   */
  async createIncome(dto: CreateIncomeDto) {
    console.log('[DEBUG] createIncome payload:', dto);
    return this.prisma.$transaction(async (tx) => {
      const [transaction] = await Promise.all([
        tx.transaction.create({
          data: {
            accountId: dto.accountId,
            categoryId: dto.categoryId,
            amount: dto.amount,
            type: dto.meiInvoiceType === MeiInvoiceType.INTERNAL_PENDING 
              ? TransactionType.TRANSFER 
              : TransactionType.INCOME,
            description: dto.description,
            date: dto.date ? new Date(dto.date) : new Date(),
            isMeiInvoice: dto.isMeiInvoice ?? false,
            meiInvoiceType: dto.meiInvoiceType,
          },
          include: { account: true, category: true },
        }),
        tx.account.update({
          where: { id: dto.accountId },
          data: { balance: { increment: dto.amount } },
        }),
      ]);

      return transaction;
    });
  }

  // ─────────────────────────────────────────────────────────────
  //  PROCESAR FACTURA MEI ← LA REGLA DE ORO
  // ─────────────────────────────────────────────────────────────

  /**
   * Operación atómica crítica: Facturación Interna MEI.
   *
   * En una sola Prisma $transaction:
   *   1. Verifica que el total MEI anual no supere el límite configurado en el usuario PJ.
   *   2. Resta `amount` de la cuenta de Rocío (EXPENSE) y descuenta balance.
   *   3. Suma `amount` a la cuenta de Pablo marcando `isMeiInvoice=true` (INCOME) y suma balance.
   *   4. Ambas transacciones comparten un `meiInvoiceGroupId` (UUID) para trazabilidad.
   *
   * Si cualquier paso falla, todo se revierte automáticamente por Prisma.
   */
  async processMeiInvoice(dto: ProcessMeiInvoiceDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoiceDate = dto.date ? new Date(dto.date) : new Date();
      const year = invoiceDate.getFullYear();

      // ── 1. Obtener las 2 cuentas y el usuario de destino (Pablo PJ)
      const [fromAccount, toAccount] = await Promise.all([
        tx.account.findUniqueOrThrow({ where: { id: dto.fromAccountId } }),
        tx.account.findUniqueOrThrow({
          where: { id: dto.toAccountId },
          include: { user: true },
        }),
      ]);

      // ── 2. Verificar saldo suficiente en la cuenta de origen (Rocío)
      if (Number(fromAccount.balance) < dto.amount) {
        throw new BadRequestException(
          `Saldo insuficiente en la cuenta origen. Disponible: ${fromAccount.balance} BRL`,
        );
      }

      // ── 3. Verificar que no se supere el límite anual MEI de Pablo
      if (toAccount.user.meiAnnualLimit) {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year + 1, 0, 1);

        const totalMeiAnual = await tx.transaction.aggregate({
          where: {
            account: { userId: toAccount.userId },
            isMeiInvoice: true,
            date: { gte: startOfYear, lt: endOfYear },
          },
          _sum: { amount: true },
        });

        const totalActual = Number(totalMeiAnual._sum.amount ?? 0);
        const limite = Number(toAccount.user.meiAnnualLimit);

        if (totalActual + dto.amount > limite) {
          throw new BadRequestException(
            `Esta factura de ${dto.amount} BRL superaría el límite MEI anual. ` +
            `Facturado: ${totalActual} BRL | Límite: ${limite} BRL | Disponible: ${limite - totalActual} BRL`,
          );
        }
      }

      // ── 4. Generar UUID de grupo para trazabilidad
      const meiInvoiceGroupId = uuidv4();

      // ── 5. Crear las 2 transacciones y actualizar los 2 saldos ATÓMICAMENTE
      const [expenseTransaction, incomeTransaction] = await Promise.all([
        // EXPENSE en Rocío (TRANSFER)
        tx.transaction.create({
          data: {
            accountId: dto.fromAccountId,
            toAccountId: dto.toAccountId,
            categoryId: dto.categoryId,
            amount: dto.amount,
            type: TransactionType.TRANSFER,
            status: TransactionStatus.PAID,
            description: dto.description ?? 'Pago Factura MEI Consultoría',
            date: invoiceDate,
            isMeiInvoice: false,
            meiInvoiceGroupId,
          },
        }),
        // INCOME en Pablo (marcado como MEI + TRANSFER)
        tx.transaction.create({
          data: {
            accountId: dto.toAccountId,
            categoryId: dto.categoryId,
            amount: dto.amount,
            type: TransactionType.TRANSFER,
            status: TransactionStatus.PAID,
            description: dto.description ?? 'Ingreso Factura MEI Consultoría',
            date: invoiceDate,
            isMeiInvoice: true, // ← FLAG AUDITABLE
            meiInvoiceType: MeiInvoiceType.INTERNAL_PENDING,
            meiInvoiceGroupId,
          },
        }),
        // Descontar balance de Rocío
        tx.account.update({
          where: { id: dto.fromAccountId },
          data: { balance: { decrement: dto.amount } },
        }),
        // Sumar balance de Pablo
        tx.account.update({
          where: { id: dto.toAccountId },
          data: { balance: { increment: dto.amount } },
        }),
      ]);

      return {
        meiInvoiceGroupId,
        expense: expenseTransaction,
        income: incomeTransaction,
        amount: dto.amount,
      };
    });
  }

  async updateTransaction(id: number, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findUniqueOrThrow({ where: { id } });
    
    if (transaction.creditCardId) {
      throw new BadRequestException('Las transacciones de tarjetas de crédito no pueden ser editadas manualmente.');
    }

    return this.prisma.$transaction(async (tx) => {
       // Reverse old transaction impact matching its type
       if (transaction.type === TransactionType.INCOME) {
         await tx.account.update({
           where: { id: transaction.accountId },
           data: { balance: { decrement: transaction.amount } }
         });
       } else if (transaction.type === TransactionType.EXPENSE) {
         await tx.account.update({
           where: { id: transaction.accountId },
           data: { balance: { increment: transaction.amount } }
         });
       }

       const newAccountId = dto.accountId ?? transaction.accountId;
       const newAmount = dto.amount ?? Number(transaction.amount);

       // Apply new transaction impact matching its type
       if (transaction.type === TransactionType.INCOME) {
         await tx.account.update({
           where: { id: newAccountId },
           data: { balance: { increment: newAmount } }
         });
       } else if (transaction.type === TransactionType.EXPENSE) {
         await tx.account.update({
           where: { id: newAccountId },
           data: { balance: { decrement: newAmount } }
         });
       }

       return tx.transaction.update({
         where: { id },
         data: {
           accountId: dto.accountId,
           categoryId: dto.categoryId,
           amount: dto.amount,
           description: dto.description,
           date: dto.date ? new Date(dto.date) : undefined,
           isMeiInvoice: dto.isMeiInvoice,
         }
       });
    });
  }

  async deleteTransaction(id: number) {
    const transaction = await this.prisma.transaction.findUniqueOrThrow({ where: { id } });

    if (transaction.creditCardId) {
      throw new BadRequestException('Las transacciones de tarjetas de crédito no pueden ser eliminadas manualmente.');
    }

    return this.prisma.$transaction(async (tx) => {
       // Reverse transaction impact
       if (transaction.type === TransactionType.INCOME) {
         await tx.account.update({
           where: { id: transaction.accountId },
           data: { balance: { decrement: transaction.amount } }
         });
       } else if (transaction.type === TransactionType.EXPENSE) {
         await tx.account.update({
           where: { id: transaction.accountId },
           data: { balance: { increment: transaction.amount } }
         });
       }

       return tx.transaction.delete({ where: { id } });
    });
  }

  async deleteCreditCardPurchase(groupId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { creditCardGroupId: groupId },
    });

    if (transactions.length === 0) {
      throw new NotFoundException('Compra no encontrada');
    }

    const cardId = transactions[0].creditCardId;

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { creditCardGroupId: groupId }
      });
    });

    // Recalculate affected statements
    const affectedMonths = new Set<string>();
    transactions.forEach(t => {
      if (t.dueDate) {
        affectedMonths.add(`${t.dueDate.getFullYear()}-${t.dueDate.getMonth()}`);
      }
    });

    for (const period of affectedMonths) {
      const [year, month] = period.split('-').map(Number);
      if (cardId) await this.creditCardsService.calculateMonthlyStatement(cardId, month, year);
    }

    return { success: true };
  }

  async updateCreditCardPurchase(groupId: string, dto: CreateExpenseDto) {
    const oldTransactions = await this.prisma.transaction.findMany({
      where: { creditCardGroupId: groupId },
    });
    
    // Create new first, then delete old to avoid data loss if create fails
    const newTx = await this.createExpense(dto);

    if (oldTransactions.length > 0) {
       await this.prisma.transaction.deleteMany({
         where: { creditCardGroupId: groupId }
       });
    }

    const oldCardId = oldTransactions.length > 0 ? oldTransactions[0].creditCardId : null;
    const newCardId = dto.creditCardId || null;
    
    // Recalculate old card statements
    if (oldCardId) {
      const oldAffectedMonths = new Set<string>();
      oldTransactions.forEach(t => {
        if (t.dueDate) oldAffectedMonths.add(`${t.dueDate.getFullYear()}-${t.dueDate.getMonth()}`);
      });
      for (const period of oldAffectedMonths) {
        const [year, month] = period.split('-').map(Number);
        await this.creditCardsService.calculateMonthlyStatement(oldCardId, month, year);
      }
    }

    // Recalculate new card statements
    if (newCardId) {
      const newAffectedMonths = new Set<string>();
      const newTxs = Array.isArray(newTx) ? newTx : [newTx];
      newTxs.forEach((t: any) => {
        if (t.dueDate) newAffectedMonths.add(`${new Date(t.dueDate).getFullYear()}-${new Date(t.dueDate).getMonth()}`);
      });
      for (const period of newAffectedMonths) {
        const [year, month] = period.split('-').map(Number);
        await this.creditCardsService.calculateMonthlyStatement(newCardId, month, year);
      }
    }

    return newTx;
  }

  // ─────────────────────────────────────────────────────────────
  //  CONSULTAS
  // ─────────────────────────────────────────────────────────────

  /** Listar transacciones con filtros flexibles */
  async findAll(filters: TransactionFilters = {}) {
    const { accountId, categoryId, type, dateFrom, dateTo, isMeiInvoice } = filters;

    const baseWhere = {
      ...(accountId && { accountId }),
      ...(categoryId && { categoryId }),
      ...(type && { type }),
      ...(isMeiInvoice !== undefined && { isMeiInvoice }),
      ...(dateFrom || dateTo
        ? {
          date: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        }
        : {}),
    };

    // 1. Fetch normal transactions (creditCardId = null)
    const normalTransactions = await this.prisma.transaction.findMany({
      where: {
        ...baseWhere,
        creditCardId: null,
      },
      include: {
        account: { include: { user: true } },
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    let consolidatedCCTransactions: any[] = [];

    // Only fetch and append credit card statements if we are looking for expenses
    if (type !== TransactionType.INCOME) {
      // 2. Ensure statements are calculated for active cards this period
      const refDate = new Date(dateFrom || new Date());
      const queryYear = refDate.getFullYear();
      const queryMonth = refDate.getMonth(); // 0-11
      
      // Solo generar si dateFrom/dateTo proveen un foco en un solo mes
      // (en la app web, el dashboard mensual pasa un mes específico siempre)
      const activeCards = await this.prisma.creditCard.findMany();
      await Promise.all(
        activeCards.map(card => 
          this.creditCardsService.calculateMonthlyStatement(card.id, queryMonth, queryYear)
        )
      );

      // 3. Fetch the generated statements and map them to virtual rows for the frontend unified table
      const statements = await this.prisma.creditCardStatement.findMany({
        where: {
          month: queryMonth,
          year: queryYear,
        },
        include: {
          creditCard: true,
        },
      });

      consolidatedCCTransactions = statements.map(st => ({
        id: `virtual-card-${st.creditCardId}-${dateFrom ? dateFrom : 'all'}`, // Keep for backwards compatibility
        statementId: st.id, // For the new Phase 4 frontend logic
        amount: Number(st.totalAmount),
        description: `Resumen Tarjeta ${st.creditCard.name}`,
        type: TransactionType.EXPENSE,
        categoryId: 0, // Mock for frontend
        accountId: st.creditCard.accountId,
        date: new Date(dateTo || new Date()), // Show at end of month typically
        dueDate: st.dueDate,
        createdAt: st.createdAt,
        updatedAt: st.updatedAt,
        creditCardId: st.creditCardId,
        status: st.status,
        isVirtual: true,
      }));
    }

    // 4. Merge and Sort descending by date
    const mergedTransactions = [...normalTransactions, ...consolidatedCCTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return mergedTransactions;
  }

  /**
   * Dashboard "Gastos de la Casa": agrupa por categoría sumando
   * transacciones EXPENSE de TODOS los usuarios en el período.
   */
  async getMonthlyHouseholdReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        type: TransactionType.EXPENSE,
        date: { gte: startDate, lt: endDate },
      },
      include: {
        category: true,
        account: { include: { user: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Agrupar por categoría
    const byCategory = transactions.reduce(
      (acc, tx) => {
        const key = tx.category.name;
        if (!acc[key]) {
          acc[key] = {
            category: tx.category,
            total: 0,
            transactions: [],
          };
        }
        acc[key].total += Number(tx.amount);
        acc[key].transactions.push(tx);
        return acc;
      },
      {} as Record<
        string,
        {
          category: { id: number; name: string; icon: string | null };
          total: number;
          transactions: typeof transactions;
        }
      >,
    );

    const totalGastos = transactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0,
    );

    // Calculate individual contributions
    // Based on previous context, Pablo is userId: 2, Rocío is userId: 1
    const totalPablo = transactions
      .filter((tx) => tx.account.userId === 2)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const totalRocio = transactions
      .filter((tx) => tx.account.userId === 1)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      period: { year, month },
      totalGastos,
      totalPablo,
      totalRocio,
      categorias: Object.values(byCategory).sort((a: any, b: any) => b.total - a.total),
    };
  }

  /**
   * Auditoría MEI: lista transacciones con isMeiInvoice=true del año,
   * con total acumulado vs. límite.
   */
  async getMeiAuditReport(userId: number, year: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        isMeiInvoice: true,
        date: { gte: startDate, lt: endDate },
      },
      include: { category: true, account: true },
      orderBy: { date: 'asc' },
    });

    const totalFacturado = transactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0,
    );
    const rawLimit = Number(user.meiAnnualLimit);
    const limite = rawLimit > 0 ? rawLimit : 81000;

    return {
      year,
      totalFacturado,
      limite,
      disponible: limite - totalFacturado,
      porcentajeUsado:
        limite > 0
          ? ((totalFacturado / limite) * 100).toFixed(2) + '%'
          : '0.00%',
      genuineInvoices: transactions.filter(tx => tx.meiInvoiceType === MeiInvoiceType.GENUINE),
      internalAccumulated: transactions.filter(tx => tx.meiInvoiceType === MeiInvoiceType.INTERNAL_PENDING),
    };
  }
}
