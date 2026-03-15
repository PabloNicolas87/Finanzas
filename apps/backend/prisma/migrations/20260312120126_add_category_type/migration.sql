-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('INCOME', 'EXPENSE', 'CREDIT_CARD');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "type" "CategoryType" NOT NULL DEFAULT 'EXPENSE';
