-- AlterTable Booking
ALTER TABLE "Booking" ADD COLUMN "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 15.0;
ALTER TABLE "Booking" ADD COLUMN "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "Booking" ADD COLUMN "providerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "Booking" ADD COLUMN "isCapacityRestored" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Payment
ALTER TABLE "Payment" ADD COLUMN "gatewayOrderId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "gatewaySignature" TEXT;
ALTER TABLE "Payment" ADD COLUMN "refundId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "refundAmount" DOUBLE PRECISION;
ALTER TABLE "Payment" ADD COLUMN "refundStatus" TEXT;
ALTER TABLE "Payment" ADD COLUMN "failureReason" TEXT;
ALTER TABLE "Payment" ADD COLUMN "metadata" JSONB;

-- CreateTable Refund
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentId" TEXT,
    "gatewayRefundId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "initiatedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable SettlementLedger
CREATE TABLE "SettlementLedger" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "providerAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "referenceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettlementLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_gatewayOrderId_idx" ON "Payment"("gatewayOrderId");
CREATE INDEX "Payment_gatewayRef_idx" ON "Payment"("gatewayRef");

CREATE UNIQUE INDEX "Refund_gatewayRefundId_key" ON "Refund"("gatewayRefundId");
CREATE INDEX "Refund_bookingId_idx" ON "Refund"("bookingId");
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

CREATE UNIQUE INDEX "SettlementLedger_bookingId_key" ON "SettlementLedger"("bookingId");
CREATE INDEX "SettlementLedger_providerId_idx" ON "SettlementLedger"("providerId");
CREATE INDEX "SettlementLedger_status_idx" ON "SettlementLedger"("status");

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SettlementLedger" ADD CONSTRAINT "SettlementLedger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SettlementLedger" ADD CONSTRAINT "SettlementLedger_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
