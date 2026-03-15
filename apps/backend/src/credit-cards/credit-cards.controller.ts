import { Controller, Get, Post, Body, Patch, Put, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';

@Controller('credit-cards')
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @Post()
  create(@Body() createCreditCardDto: CreateCreditCardDto) {
    return this.creditCardsService.create(createCreditCardDto);
  }

  @Get()
  findAll() {
    return this.creditCardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.creditCardsService.findOne(id);
  }

  @Get(':id/statement')
  getStatement(
    @Param('id', ParseIntPipe) id: number,
    @Query('month', ParseIntPipe) month: number, // 0-indexed (0 = January)
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.creditCardsService.getStatement(id, month, year);
  }

  @Put('statements/:id/status')
  updateStatementStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: TransactionStatus,
  ) {
    console.log(`[DEBUG] Received PUT for statement ${id} with status: ${status}`);
    return this.creditCardsService.updateStatementStatus(id, status);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCreditCardDto: UpdateCreditCardDto) {
    return this.creditCardsService.update(id, updateCreditCardDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.creditCardsService.remove(id);
  }
}
