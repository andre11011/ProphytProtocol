/*
  Warnings:

  - A unique constraint covering the columns `[blockchainMarketId]` on the table `ProphetMarketCreatedEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ProphetMarketCreatedEvent" ADD COLUMN     "blockchainMarketId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProphetMarketCreatedEvent_blockchainMarketId_key" ON "ProphetMarketCreatedEvent"("blockchainMarketId");
