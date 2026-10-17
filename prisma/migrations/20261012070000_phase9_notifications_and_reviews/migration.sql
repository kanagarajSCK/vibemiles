-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
    'BOOKING_CONFIRMED',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'BOOKING_CANCELLED',
    'REFUND_PROCESSED',
    'PROVIDER_VERIFIED',
    'PROVIDER_REJECTED',
    'LISTING_APPROVED',
    'LISTING_REJECTED',
    'ACCOUNT_SUSPENDED',
    'ACCOUNT_REACTIVATED',
    'NEW_REVIEW',
    'SYSTEM_BROADCAST'
);

-- AlterTable Review
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "dedupKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupKey_key" ON "Notification"("dedupKey");
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_dedupKey_idx" ON "Notification"("dedupKey");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
