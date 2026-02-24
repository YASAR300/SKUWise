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

        const userId = session.user.id;

        // Fetch all products, sales, and reviews in parallel
        const [products, salesData, reviews] = await Promise.all([
            prisma.product.findMany({
                where: { userId },
                include: {
                    salesData: { orderBy: { date: "desc" }, take: 30 },
                    reviews: true,
                },
            }),
            prisma.salesData.findMany({
                where: { product: { userId } },
                include: { product: { select: { name: true, category: true, price: true } } },
                orderBy: { date: "desc" },
                take: 90,
            }),
            prisma.review.findMany({
                where: { product: { userId } },
                orderBy: { date: "desc" },
                take: 100,
            }),
        ]);

        // ── KPI Metrics ──
        const totalRevenue = salesData.reduce((s, d) => s + d.revenue, 0);
        const totalUnitsSold = salesData.reduce((s, d) => s + d.unitsSold, 0);
        const totalProducts = products.length;
        const lowStockCount = products.filter(p => p.stock <= (p.reorderPoint || 10)).length;
        const outOfStockCount = products.filter(p => p.stock === 0).length;
        const avgRating = reviews.length > 0
            ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
            : 0;
        const totalInventoryValue = products.reduce((s, p) => s + (p.stock * (p.cost || 0)), 0);

        // ── Revenue Trend (last 30 days, grouped by date) ──
        const revenueByDate = {};
        salesData.forEach(d => {
            const date = new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            revenueByDate[date] = (revenueByDate[date] || 0) + d.revenue;
        });
        const revenueTrend = Object.entries(revenueByDate)
            .slice(-14)
            .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }));

        // ── Category Breakdown ──
        const categoryMap = {};
        products.forEach(p => {
            const cat = p.category || "Other";
            if (!categoryMap[cat]) categoryMap[cat] = { revenue: 0, count: 0, stock: 0, totalValue: 0 };
            categoryMap[cat].count++;
            categoryMap[cat].stock += p.stock;
            categoryMap[cat].totalValue += p.stock * (p.price || 0);
            p.salesData.forEach(s => { categoryMap[cat].revenue += s.revenue; });
        });
        const categoryBreakdown = Object.entries(categoryMap)
            .map(([name, data]) => ({
                name,
                revenue: parseFloat(data.revenue.toFixed(2)),
                productCount: data.count,
                stock: data.stock,
                totalValue: parseFloat(data.totalValue.toFixed(2)),
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8);

        // ── Top Products by Revenue ──
        const topProducts = products
            .map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                price: p.price,
                stock: p.stock,
                revenue: p.salesData.reduce((s, d) => s + d.revenue, 0),
                unitsSold: p.salesData.reduce((s, d) => s + d.unitsSold, 0),
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // ── Stock Health Distribution ──
        const stockHealth = {
            healthy: products.filter(p => p.stock > (p.reorderPoint || 10)).length,
            low: products.filter(p => p.stock > 0 && p.stock <= (p.reorderPoint || 10)).length,
            out: products.filter(p => p.stock === 0).length,
        };

        // ── Margin Analysis ──
        const highMargin = products.filter(p => p.cost && p.price && ((p.price - p.cost) / p.price) > 0.4).length;
        const lowMargin = products.filter(p => p.cost && p.price && ((p.price - p.cost) / p.price) < 0.2).length;

        return NextResponse.json({
            kpis: {
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalUnitsSold,
                totalProducts,
                lowStockCount,
                outOfStockCount,
                avgRating: parseFloat(avgRating),
                totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)),
                highMarginCount: highMargin,
                lowMarginCount: lowMargin,
            },
            revenueTrend,
            categoryBreakdown,
            topProducts,
            stockHealth,
        });
    } catch (error) {
        console.error("Analytics API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
