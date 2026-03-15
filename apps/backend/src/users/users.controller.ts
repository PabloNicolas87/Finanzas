import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneById(id);
  }

  @Get(':id/mei-summary/:year')
  getMeiSummary(
    @Param('id', ParseIntPipe) id: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.usersService.getMeiAnnualSummary(id, year);
  }
}
