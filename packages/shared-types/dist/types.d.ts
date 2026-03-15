export declare enum TransactionType {
    INCOME = "INCOME",
    EXPENSE = "EXPENSE",
    TRANSFER = "TRANSFER"
}
export declare enum TransactionStatus {
    PENDING = "PENDING",
    PAID = "PAID"
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
    id: number | string;
    accountId: number;
    categoryId: number;
    amount: string | number;
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
    isVirtual?: boolean;
    creditCardGroupId?: string | null;
    purchaseDate?: string | Date | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}
