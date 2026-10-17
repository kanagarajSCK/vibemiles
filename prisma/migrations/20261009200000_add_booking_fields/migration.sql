-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "availabilityId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "contactName" TEXT;
ALTER TABLE "Booking" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "Booking" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "Booking" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Booking" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Booking_availabilityId_idx" ON "Booking"("availabilityId");

-- CreateIndex
CREATE INDEX "Booking_expiresAt_idx" ON "Booking"("expiresAt");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "PackageAvailability"("id") ON DELETE SET NULL ON UPDATE CASCADE;
