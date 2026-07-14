-- AlterTable
ALTER TABLE "customer" ADD COLUMN "phoneNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customer_phoneNumber_name_key" ON "customer"("phoneNumber", "name");
