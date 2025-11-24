/*
  Warnings:

  - A unique constraint covering the columns `[blockchainMarketId]` on the table `Market` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "blockchainMarketId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Market_blockchainMarketId_key" ON "Market"("blockchainMarketId");
