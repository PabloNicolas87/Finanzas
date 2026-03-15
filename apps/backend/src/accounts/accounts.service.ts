// src/accounts/accounts.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listar todas las cuentas almacenadas en el sistema */
  findAll() {
    return this.prisma.account.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /** Listar todas las cuentas de un usuario con su saldo actual */
  findByUser(userId: number) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  /** Obtener una cuenta por ID */
  findOneById(id: number) {
    return this.prisma.account.findUniqueOrThrow({ where: { id } });
  }

  /** Retornar solo el saldo de una cuenta */
  async getBalance(accountId: number): Promise<number> {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      select: { balance: true },
    });
    return Number(account.balance);
  }

  /**
   * Sumar o restar del saldo de una cuenta de forma atómica.
   * Si `amount` es positivo → suma (ingreso).
   * Si `amount` es negativo → resta (egreso).
   * Acepta un cliente Prisma transaccional (`tx`) para operaciones atómicas compuestas.
   */
  async updateBalance(
    accountId: number,
    amount: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    // Verificar saldo suficiente antes de un egreso
    if (amount < 0) {
      const account = await client.account.findUniqueOrThrow({
        where: { id: accountId },
        select: { balance: true },
      });
      if (Number(account.balance) + amount < 0) {
        throw new BadRequestException(
          `Saldo insuficiente en la cuenta ${accountId}`,
        );
      }
    }

    return client.account.update({
      where: { id: accountId },
      data: { balance: { increment: amount } },
    });
  }
}
