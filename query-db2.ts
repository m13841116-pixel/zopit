import { getPrisma } from './src/prisma.js';
async function main() {
  const prisma = getPrisma();
  const configs = await prisma.systemConfig.findMany();
  console.log(configs);
}
main();
