const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    try {
        console.log("Checking products...");
        const count = await prisma.product.count();
        console.log("Product Count:", count);

        const products = await prisma.product.findMany({ take: 5 });
        console.log("Sample Products:", JSON.stringify(products, null, 2));
    } catch (error) {
        console.error("Prisma Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
