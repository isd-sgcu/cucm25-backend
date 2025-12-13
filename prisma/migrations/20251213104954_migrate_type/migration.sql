/*
  Warnings:

  - Added the required column `type_old` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('ADMIN_ADJUSTMENT', 'CODE_REDEMPTION', 'GIFT', 'PAYMENT', 'TICKET_PURCHASE', 'LEGACY_UNDEFINED');

-- AlterTable
ALTER TABLE "transactions" RENAME COLUMN "type" TO "old_type";

-- AlterTable
ALTER TABLE "transactions"
ALTER COLUMN "old_type" DROP NOT NULL,
ADD COLUMN "type" "transaction_type" NOT NULL DEFAULT 'LEGACY_UNDEFINED';
