const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
    const email = "yasar.khan.cg@gmail.com";
    const password = "Admin@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("🚀 Starting data migration to user:", email);

    // 1. Create or Find User
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: "Yasar Khan",
            },
        });
        console.log("✅ User created.");
    } else {
        console.log("ℹ️ User already exists.");
    }

    const userId = user.id;

    // 2. Link existing data
    const products = await prisma.product.updateMany({
        where: { userId: null },
        data: { userId },
    });
    console.log(`📦 Linked ${products.count} products.`);

    const conversations = await prisma.conversation.updateMany({
        where: { userId: null },
        data: { userId },
    });
    console.log(`💬 Linked ${conversations.count} conversations.`);

    const research = await prisma.researchSession.updateMany({
        where: { userId: null },
        data: { userId },
    });
    console.log(`🔍 Linked ${research.count} research sessions.`);

    console.log("✨ Migration complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
