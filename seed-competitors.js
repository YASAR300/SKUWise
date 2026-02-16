const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding Competitor Data...");

    const products = await prisma.product.findMany({ take: 20 });

    if (products.length === 0) {
        console.log("❌ No products found to attach competitor data to.");
        return;
    }

    const competitors = ["TechGiant", "MarketFlex", "PrimeStore", "EcoDeals"];

    for (const product of products) {
        for (const compName of competitors) {
            // Generate slightly different prices and ratings for each competitor
            const priceVariation = (Math.random() * 0.4) - 0.2; // -20% to +20%
            const compPrice = product.price * (1 + priceVariation);
            const compRating = Math.min(5, Math.max(1, (product.rating || 4) + (Math.random() * 2 - 1)));

            await prisma.competitorData.create({
                data: {
                    productId: product.id,
                    competitorName: compName,
                    competitorPrice: compPrice,
                    rating: compRating,
                    features: {
                        shippingSpeed: Math.random() > 0.5 ? "Express" : "Standard",
                        warranty: Math.random() > 0.5 ? "1 Year" : "None",
                        ecoFriendly: Math.random() > 0.7
                    }
                }
            });
        }
    }

    console.log(`✅ Seeded competitor data for ${products.length} products.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
