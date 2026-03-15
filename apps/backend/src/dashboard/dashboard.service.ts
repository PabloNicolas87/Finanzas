import { Injectable } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreditCardsService } from '../credit-cards/credit-cards.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService,
    private readonly creditCardsService: CreditCardsService,
    private readonly prisma: PrismaService,
  ) {}

  async getSummary(month: number, year: number) {
    // 1. Cash Flow (Income vs Expense) - Only Genuine ones
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    const monthlyTransactions = await this.prisma.transaction.findMany({
      where: {
        date: { gte: startOfMonth, lt: endOfMonth },
        // Excluding internal transfers from Cash Flow
        type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
        // Excluding individual credit card expenses as they are counted via Statements
        OR: [
          { type: TransactionType.INCOME },
          { type: TransactionType.EXPENSE, creditCardId: null },
        ],
      },
    });

    const income = monthlyTransactions
      .filter(tx => tx.type === TransactionType.INCOME)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const expense = monthlyTransactions
      .filter((tx) => tx.type === TransactionType.EXPENSE)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    // New: Sum Credit Card Statements for the month
    const statementsSum = await this.prisma.creditCardStatement.aggregate({
      where: {
        month: month - 1, // 0-indexed in DB
        year: year,
      },
      _sum: {
        totalAmount: true,
      },
    });
    const creditCardExpenses = Number(statementsSum._sum.totalAmount || 0);
    const totalExpenses = expense + creditCardExpenses;

    // 2. Accounts Balances
    const accounts = await this.accountsService.findAll();

    // 3. Credit Cards Statements
    const cards = await this.creditCardsService.findAll();
    const creditCards = await Promise.all(
      cards.map(async (card) => {
        const statement = await this.creditCardsService.calculateMonthlyStatement(card.id, month - 1, year);
        return {
          name: card.name,
          total: Number(statement.totalAmount),
          status: statement.status,
          dueDate: statement.dueDate,
        };
      }),
    );

    // 4. MEI Status (Annual)
    // Look for a PJ user (Pablo) instead of hardcoding an ID
    const pablo = await this.prisma.user.findFirst({ where: { type: 'PJ' } });
    let meiStatus = { total: 0, limit: 81000, percentage: 0 };

    if (pablo) {
      const meiReport = await this.transactionsService.getMeiAuditReport(pablo.id, year);
      meiStatus = {
        total: meiReport.totalFacturado,
        limit: meiReport.limite,
        percentage: parseFloat(meiReport.porcentajeUsado),
      };
    }

    // 5. Category Chart (Expenses only)
    const categoryReport = await this.transactionsService.getMonthlyHouseholdReport(year, month);

    return {
      cashFlow: {
        income,
        expense: totalExpenses,
        available: income - totalExpenses,
      },
      accounts: accounts.map(acc => ({
        name: acc.name,
        bankName: acc.bankName,
        balance: Number(acc.balance),
      })),
      creditCards,
      meiStatus,
      categories: categoryReport.categorias.map((c: any) => ({
        name: c.category.name,
        total: c.total,
      })),
    };
  }
}
