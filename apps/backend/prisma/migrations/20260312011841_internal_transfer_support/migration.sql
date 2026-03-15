-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "MeiInvoiceType" AS ENUM ('GENUINE', 'INTERNAL_PENDING');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "isFixed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "creditCardGroupId" TEXT,
ADD COLUMN     "creditCardId" INTEGER,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "installmentNumber" INTEGER,
ADD COLUMN     "meiInvoiceType" "MeiInvoiceType",
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "toAccountId" INTEGER,
ADD COLUMN     "totalInstallments" INTEGER;

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "closingDay" INTEGER NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_card_statements" (
    "id" SERIAL NOT NULL,
    "creditCardId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_card_statements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_statements_creditCardId_month_year_key" ON "credit_card_statements"("creditCardId", "month", "year");

-- CreateIndex
CREATE INDEX "transactions_creditCardGroupId_idx" ON "transactions"("creditCardGroupId");

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_statements" ADD CONSTRAINT "credit_card_statements_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "credit_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "credit_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
