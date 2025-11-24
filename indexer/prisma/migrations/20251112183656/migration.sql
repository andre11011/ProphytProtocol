-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "ProphetMarketCreatedEvent"("marketId") ON DELETE RESTRICT ON UPDATE CASCADE;
