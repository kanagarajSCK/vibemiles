-- AlterTable
ALTER TABLE "Package" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "Package" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
