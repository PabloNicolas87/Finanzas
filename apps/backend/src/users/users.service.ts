// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listar todos los usuarios con sus cuentas */
  findAll() {
    return this.prisma.user.findMany({
      include: { accounts: true },
    });
  }

  /** Obtener un usuario por ID */
  findOneById(id: number) {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }

  /**
   * Calcular el total facturado MEI en el año y compararlo con el límite.
   * Solo aplica para usuarios de tipo PJ.
   */
  async getMeiAnnualSummary(userId: number, year: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const result = await this.prisma.transaction.aggregate({
      where: {
        account: { userId },
        isMeiInvoice: true,
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    });

    const totalFacturado = result._sum.amount ?? 0;
    const limite = user.meiAnnualLimit ?? 0;

    return {
      year,
      totalFacturado,
      limite,
      disponible: Number(limite) - Number(totalFacturado),
      porcentajeUsado:
        Number(limite) > 0
          ? ((Number(totalFacturado) / Number(limite)) * 100).toFixed(2)
          : '0.00',
    };
  }
}
