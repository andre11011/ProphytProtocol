-- Drop the foreign key constraint that prevents creating markets without blockchain events
ALTER TABLE "Market" DROP CONSTRAINT "Market_marketId_fkey";
