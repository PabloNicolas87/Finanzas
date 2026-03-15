import { Controller, Get, Param, ParseIntPipe, Patch, Body } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.accountsService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.accountsService.findOneById(id);
  }

  @Get(':id/balance')
  getBalance(@Param('id', ParseIntPipe) id: number) {
    return this.accountsService.getBalance(id);
  }

  @Patch(':id/balance')
  updateBalance(
    @Param('id', ParseIntPipe) id: number,
    @Body('amount') amount: number,
  ) {
    return this.accountsService.updateBalance(id, amount);
  }
}
