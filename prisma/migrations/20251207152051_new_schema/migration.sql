-- DropIndex
DROP INDEX "public"."users_username_idx";

-- CreateTable
CREATE TABLE "codes" (
    "id" SERIAL NOT NULL,
    "code_string" VARCHAR(50) NOT NULL,
    "target_role" VARCHAR(50) NOT NULL DEFAULT 'junior',
    "activity_name" VARCHAR(255) NOT NULL,
    "reward_coin" INTEGER NOT NULL DEFAULT 0,
    "created_by_user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_redemptions" (
    "user_id" UUID NOT NULL,
    "code_id" INTEGER NOT NULL,
    "redeemed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_redemptions_pkey" PRIMARY KEY ("user_id","code_id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "sender_user_id" UUID,
    "recipient_user_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "coin_amount" INTEGER NOT NULL DEFAULT 0,
    "related_code_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" TEXT,
    "description" TEXT,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("setting_key")
);

-- CreateIndex
CREATE UNIQUE INDEX "codes_code_string_key" ON "codes"("code_string");

-- CreateIndex
CREATE INDEX "users_id_username_idx" ON "users"("id", "username");

-- AddForeignKey
ALTER TABLE "codes" ADD CONSTRAINT "codes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "code_redemptions" ADD CONSTRAINT "code_redemptions_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "codes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "code_redemptions" ADD CONSTRAINT "code_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_related_code_id_fkey" FOREIGN KEY ("related_code_id") REFERENCES "codes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
