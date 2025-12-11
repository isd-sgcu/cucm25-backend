-- CreateTable
CREATE TABLE "ticket_purchases" (
    "id" UUID NOT NULL,
    "event_name" VARCHAR(255) NOT NULL,
    "count" INTEGER NOT NULL,
    "ticket_price" INTEGER NOT NULL,
    "total_price" INTEGER NOT NULL,
    "purchase_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "ticket_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_purchases_purchase_at_idx" ON "ticket_purchases"("purchase_at");

-- AddForeignKey
ALTER TABLE "ticket_purchases" ADD CONSTRAINT "ticket_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
