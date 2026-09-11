const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "fulfillmentRate" DOUBLE PRECISION DEFAULT 100.0');
    console.log("Added fulfillmentRate");
  } catch (e) { console.error(e.message); }
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "avgProcessingTimeHours" DOUBLE PRECISION DEFAULT 12.0');
    console.log("Added avgProcessingTimeHours");
  } catch (e) { console.error(e.message); }
}
main();
