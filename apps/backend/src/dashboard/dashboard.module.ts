import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AccountsModule } from '../accounts/accounts.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { CreditCardsModule } from '../credit-cards/credit-cards.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    AccountsModule,
    TransactionsModule,
    CreditCardsModule,
    PrismaModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
