import { Controller, Post, Body } from '@nestjs/common';
import { MeiService } from './mei.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

class InternalTransferDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  description?: string;
}

@ApiTags('mei')
@Controller('mei')
export class MeiController {
  constructor(private readonly meiService: MeiService) {}

  @Post('internal-transfer')
  @ApiOperation({ summary: 'Realiza una transferencia interna PF -> PJ con reserva de cupo MEI' })
  async createInternalTransfer(@Body() body: InternalTransferDto) {
    return this.meiService.createInternalTransfer({
      amount: body.amount,
      date: new Date(body.date),
      description: body.description,
    });
  }
}
