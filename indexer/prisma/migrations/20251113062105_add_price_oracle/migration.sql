-- CreateTable
CREATE TABLE "Price" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "marketCap" BIGINT,
    "volume24h" BIGINT,
    "change24h" DOUBLE PRECISION,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Price_symbol_idx" ON "Price"("symbol");

-- CreateIndex
CREATE INDEX "Price_currency_idx" ON "Price"("currency");

-- CreateIndex
CREATE INDEX "Price_fetchedAt_idx" ON "Price"("fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Price_symbol_currency_key" ON "Price"("symbol", "currency");
