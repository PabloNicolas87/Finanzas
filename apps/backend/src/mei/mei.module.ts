import { Module } from '@nestjs/common';
import { MeiService } from './mei.service';
import { MeiController } from './mei.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MeiController],
  providers: [MeiService],
  exports: [MeiService],
})
export class MeiModule {}
