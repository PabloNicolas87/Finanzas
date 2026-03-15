import { Controller, Get, Post, Patch, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionStatus, TransactionType } from '@prisma/client';
import type { 
  CreateExpenseDto, 
  CreateIncomeDto, 
  ProcessMeiInvoiceDto,
  UpdateTransactionDto
} from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('expense')
  createExpense(@Body() createExpenseDto: CreateExpenseDto) {
    return this.transactionsService.createExpense(createExpenseDto);
  }

  @Post('income')
  createIncome(@Body() createIncomeDto: CreateIncomeDto) {
    return this.transactionsService.createIncome(createIncomeDto);
  }

  @Post('mei-invoice')
  processMeiInvoice(@Body() processMeiInvoiceDto: ProcessMeiInvoiceDto) {
    return this.transactionsService.processMeiInvoice(processMeiInvoiceDto);
  }


  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: TransactionStatus,
  ) {
    return this.transactionsService.updateStatus(id, status);
  }

  @Put(':id')
  updateTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.updateTransaction(id, updateDto);
  }

  @Put('credit-card-purchase/:groupId')
  updateCreditCardPurchase(
    @Param('groupId') groupId: string,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.transactionsService.updateCreditCardPurchase(groupId, createExpenseDto);
  }

  @Delete('credit-card-purchase/:groupId')
  deleteCreditCardPurchase(
    @Param('groupId') groupId: string,
  ) {
    return this.transactionsService.deleteCreditCardPurchase(groupId);
  }

  @Delete(':id')
  deleteTransaction(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transactionsService.deleteTransaction(id);
  }

  @Get()
  findAll(
    @Query('accountId') accountId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('isMeiInvoice') isMeiInvoice?: string,
  ) {
    return this.transactionsService.findAll({
      accountId: accountId ? parseInt(accountId, 10) : undefined,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      type: type || TransactionType.EXPENSE, // Force EXPENSE by default for the Monthly Expense Sheet
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      isMeiInvoice: isMeiInvoice ? isMeiInvoice === 'true' : undefined,
    });
  }

  @Get('reports/household')
  getHouseholdReport(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.transactionsService.getMonthlyHouseholdReport(year, month);
  }

  @Get('reports/mei-audit/:userId/:year')
  getMeiAuditReport(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.transactionsService.getMeiAuditReport(userId, year);
  }
}
