// src/categories/categories.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryType } from '@prisma/client';

export interface CreateCategoryDto {
  name: string;
  icon?: string;
  type: CategoryType;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listar todas las categorías globales (opcionalmente filtradas por tipo) */
  findAll(type?: CategoryType) {
    return this.prisma.category.findMany({
      where: type ? { type } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  /** Obtener categoría por ID */
  findOneById(id: number) {
    return this.prisma.category.findUniqueOrThrow({ where: { id } });
  }

  /** Crear nueva categoría global */
  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  /** Editar nombre/ícono de una categoría */
  update(id: number, dto: Partial<CreateCategoryDto>) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  /** Eliminar categoría solo si no tiene transacciones asociadas */
  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true } } },
    });

    if (!category) throw new NotFoundException('Categoría no encontrada');
    if (category._count.transactions > 0) {
      throw new BadRequestException(
        `No se puede eliminar: la categoría tiene ${category._count.transactions} transacciones asociadas`,
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }
}
