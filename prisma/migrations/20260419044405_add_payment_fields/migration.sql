-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentType" TEXT,
ADD COLUMN     "settlementTime" TIMESTAMP(3),
ADD COLUMN     "snapToken" TEXT;
