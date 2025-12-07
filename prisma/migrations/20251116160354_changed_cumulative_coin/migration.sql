/*
  Warnings:

  - You are about to drop the column `current_level` on the `wallets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wallets" DROP COLUMN "current_level",
ADD COLUMN     "cumulative_coin" INTEGER NOT NULL DEFAULT 0;
