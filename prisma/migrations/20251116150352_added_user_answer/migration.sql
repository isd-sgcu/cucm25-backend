-- CreateEnum
CREATE TYPE "role_type" AS ENUM ('PARTICIPANT', 'STAFF', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('M4', 'M5', 'M6', 'Y1', 'Y2', 'Y3', 'Y4', 'GRADUATED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "student_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "role" "role_type" NOT NULL,
    "education_level" "EducationLevel" NOT NULL,
    "school" TEXT NOT NULL,
    "is_reset_user" BOOLEAN NOT NULL DEFAULT false,
    "terms_accepted_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "user_id" UUID NOT NULL,
    "coin_balance" INTEGER NOT NULL DEFAULT 0,
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "gift_sends_remaining" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_answers" (
    "user_id" UUID NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_answers_pkey" PRIMARY KEY ("user_id","question_id")
);

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE INDEX "wallets_coin_balance_idx" ON "wallets"("coin_balance");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_fkey1" FOREIGN KEY ("id") REFERENCES "wallets"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
