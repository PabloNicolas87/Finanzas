export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface User {
  id: number;
  name: string;
  email: string;
  type: 'PJ' | 'PF';
  meiAnnualLimit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: number;
  userId: number;
  bankName: string;
  name: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCard {
  id: number;
  accountId: number;
  name: string;
  closingDay: number;
  dueDay: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  isFixed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number | string; // virtual IDs are strings, Prisma IDs are numbers
  accountId: number;
  categoryId: number;
  amount: string | number; // Sometimes it arrives as a number initially from virtual group
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  date: string | Date;
  dueDate: string | Date | null;
  
  isMeiInvoice: boolean;
  meiInvoiceGroupId: string | null;
  
  creditCardId: number | null;
  installmentNumber: number | null;
  totalInstallments: number | null;

  isVirtual?: boolean; // True for grouped Credit Card Statements

  creditCardGroupId?: string | null;
  purchaseDate?: string | Date | null;

  createdAt: string | Date;
  updatedAt: string | Date;
}
