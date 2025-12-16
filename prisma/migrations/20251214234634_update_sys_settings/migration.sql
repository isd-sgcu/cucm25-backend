/*
  Warnings:

  - Made the column `setting_value` on table `system_settings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "system_settings" ALTER COLUMN "setting_value" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;
