import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { CategoryType } from '@prisma/client';
import { CategoriesService } from './categories.service';
import type { CreateCategoryDto } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Query('type') type?: CategoryType) {
    return this.categoriesService.findAll(type);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOneById(id);
  }

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: Partial<CreateCategoryDto>,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
