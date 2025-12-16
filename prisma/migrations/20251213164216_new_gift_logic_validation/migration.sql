/*
  Warnings:

  - You are about to drop the column `gift_sends_remaining` on the `wallets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wallets" DROP COLUMN "gift_sends_remaining",
ADD COLUMN     "gift_sends" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "last_gift_reset" TIMESTAMPTZ;
