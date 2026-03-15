import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Obtiene el resumen consolidado para el dashboard principal' })
  async getSummary(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.dashboardService.getSummary(month, year);
  }
}
