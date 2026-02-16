import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category") || "all";

        const where = {
            userId: session.user.id,
            AND: [
                category !== "all" ? { category } : {}
            ]
        };

        const [products, userCategories] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    competitorData: true,
                    salesData: {
                        orderBy: { date: 'desc' },
                        take: 7
                    }
                },
                take: 50
            }),
            prisma.product.findMany({
                where: { userId: session.user.id },
                select: { category: true },
                distinct: ['category'],
            })
        ]);

        const analysis = products.map(product => {
            const avgCompPrice = product.competitorData.length > 0
                ? product.competitorData.reduce((sum, c) => sum + c.competitorPrice, 0) / product.competitorData.length
                : product.price;

            const priceGap = ((product.price - avgCompPrice) / avgCompPrice) * 100;

            // Root Cause Logic
            let rootCause = "Stable";
            let severity = "low";

            if (priceGap > 15) {
                rootCause = "Price Over-Premium";
                severity = "high";
            } else if (product.stock < (product.reorderPoint || 10)) {
                rootCause = "Inventory Depletion";
                severity = "medium";
            } else if (product.rating < 3.5) {
                rootCause = "Sentiment Erosion";
                severity = "medium";
            }

            return {
                id: product.id,
                name: product.name,
                category: product.category,
                ourPrice: product.price,
                avgCompetitorPrice: avgCompPrice,
                priceGap: priceGap.toFixed(2),
                rating: product.rating,
                stock: product.stock,
                rootCause,
                severity,
                competitors: product.competitorData
            };
        });

        return NextResponse.json({
            analysis,
            categories: userCategories.map(c => c.category),
            summary: {
                totalAnalyzed: products.length,
                highRiskAssets: analysis.filter(a => a.severity === 'high').length,
                avgMarketGap: analysis.length > 0
                    ? (analysis.reduce((sum, a) => sum + parseFloat(a.priceGap), 0) / analysis.length).toFixed(2)
                    : 0
            }
        });
    } catch (error) {
        console.error("Analysis API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
