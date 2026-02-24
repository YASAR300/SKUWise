// Report Generator - Data Aggregation and Report Generation
import { prisma } from "@/lib/prisma";

/**
 * Generate Inventory Health Report
 * Analyzes stock levels, turnover rates, and reorder points
 */
export async function generateInventoryReport(userId, filters = {}) {
    const { dateRange, categories, brands, minStock, maxStock } = filters;

    try {
        // Build query filters with userId enforcement
        const where = { userId };
        if (categories?.length) where.category = { in: categories };
        if (brands?.length) where.brand = { in: brands };
        if (minStock !== undefined) where.stock = { gte: minStock };
        if (maxStock !== undefined) where.stock = { ...where.stock, lte: maxStock };

        // Fetch products
        const products = await prisma.product.findMany({ where });

        // Calculate metrics
        const totalProducts = products.length;
        const totalStockValue = products.reduce((sum, p) => sum + (p.stock * (p.cost || 0)), 0);
        const lowStockItems = products.filter(p => p.reorderPoint && p.stock <= p.reorderPoint);
        const outOfStock = products.filter(p => p.stock === 0);
        const overstock = products.filter(p => p.stock > (p.reorderPoint || 0) * 3);

        // Group by category
        const byCategory = products.reduce((acc, p) => {
            const cat = p.category || "Uncategorized";
            if (!acc[cat]) acc[cat] = { count: 0, stockValue: 0, items: [] };
            acc[cat].count++;
            acc[cat].stockValue += p.stock * (p.cost || 0);
            acc[cat].items.push(p);
            return acc;
        }, {});

        return {
            type: "inventory",
            generatedAt: new Date().toISOString(),
            summary: {
                totalProducts,
                totalStockValue,
                lowStockCount: lowStockItems.length,
                outOfStockCount: outOfStock.length,
                overstockCount: overstock.length,
            },
            data: {
                allProducts: products,
                lowStockItems,
                outOfStock,
                overstock,
                byCategory,
            },
            insights: generateInventoryInsights(products, lowStockItems, outOfStock, overstock),
        };
    } catch (error) {
        console.error("Inventory report generation failed:", error);
        throw new Error("Failed to generate inventory report");
    }
}

/**
 * Generate Margin Analysis Report
 * Analyzes profit margins, cost breakdowns, and pricing
 */
export async function generateMarginReport(userId, filters = {}) {
    const { categories, brands } = filters;

    try {
        const where = { userId };
        if (categories?.length) where.category = { in: categories };
        if (brands?.length) where.brand = { in: brands };

        const products = await prisma.product.findMany({ where });

        // Calculate margins
        const productsWithMargin = products.map(p => {
            const price = p.price || 0;
            const cost = p.cost || 0;
            const margin = price - cost;
            const marginPercent = price > 0 ? (margin / price) * 100 : 0;
            const stock = p.stock || 0;

            return {
                ...p,
                margin,
                marginPercent,
                totalRevenue: price * stock,
                totalCost: cost * stock,
                totalProfit: margin * stock,
            };
        });

        const totalRevenue = productsWithMargin.reduce((sum, p) => sum + p.totalRevenue, 0);
        const totalCost = productsWithMargin.reduce((sum, p) => sum + p.totalCost, 0);
        const totalProfit = totalRevenue - totalCost;
        const avgMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        // Find top/bottom performers
        const sortedByMargin = [...productsWithMargin].sort((a, b) => b.marginPercent - a.marginPercent);
        const topMarginProducts = sortedByMargin.slice(0, 10);
        const bottomMarginProducts = sortedByMargin.slice(-10);

        return {
            type: "margin",
            generatedAt: new Date().toISOString(),
            summary: {
                totalRevenue,
                totalCost,
                totalProfit,
                avgMarginPercent: avgMarginPercent.toFixed(2),
                productCount: products.length,
            },
            data: {
                allProducts: productsWithMargin,
                topMarginProducts,
                bottomMarginProducts,
            },
            insights: generateMarginInsights(productsWithMargin, avgMarginPercent),
        };
    } catch (error) {
        console.error("Margin report generation failed:", error);
        throw new Error("Failed to generate margin report");
    }
}

/**
 * Generate Sales Performance Report
 * Analyzes revenue, trends, and top products
 */
export async function generateSalesReport(userId, filters = {}) {
    const { dateRange, categories } = filters;

    try {
        const where = { userId };
        if (categories?.length) where.category = { in: categories };

        const products = await prisma.product.findMany({ where });

        // Calculate sales metrics
        const productsWithSales = products.map(p => {
            const price = p.price || 0;
            const cost = p.cost || 0;
            const stock = p.stock || 0;
            return {
                ...p,
                revenue: price * stock,
                profit: (price - cost) * stock,
            };
        });

        const totalRevenue = productsWithSales.reduce((sum, p) => sum + p.revenue, 0);
        const totalProfit = productsWithSales.reduce((sum, p) => sum + p.profit, 0);

        // Top products by revenue
        const topProducts = [...productsWithSales]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        return {
            type: "sales",
            generatedAt: new Date().toISOString(),
            summary: {
                totalRevenue,
                totalProfit,
                productCount: products.length,
                avgRevenuePerProduct: products.length > 0 ? totalRevenue / products.length : 0,
            },
            data: {
                allProducts: productsWithSales,
                topProducts,
            },
            insights: generateSalesInsights(productsWithSales, totalRevenue),
        };
    } catch (error) {
        console.error("Sales report generation failed:", error);
        throw new Error("Failed to generate sales report");
    }
}

/**
 * Generate Competitive Analysis Report
 * Compares products and identifies gaps
 */
export async function generateCompetitiveReport(userId, filters = {}) {
    const { categories } = filters;

    try {
        const where = { userId };
        if (categories?.length) where.category = { in: categories };

        const products = await prisma.product.findMany({ where });

        // Group by category for comparison
        const byCategory = products.reduce((acc, p) => {
            const cat = p.category || "Uncategorized";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(p);
            return acc;
        }, {});

        // Analyze each category
        const categoryAnalysis = Object.entries(byCategory).map(([category, items]) => {
            const avgPrice = items.length > 0 ? items.reduce((sum, p) => sum + p.price, 0) / items.length : 0;
            const avgCost = items.length > 0 ? items.reduce((sum, p) => sum + p.cost, 0) / items.length : 0;
            const avgMargin = avgPrice > 0 ? ((avgPrice - avgCost) / avgPrice) * 100 : 0;

            return {
                category,
                productCount: items.length,
                avgPrice,
                avgCost,
                avgMargin,
                priceRange: {
                    min: Math.min(...items.map(p => p.price)),
                    max: Math.max(...items.map(p => p.price)),
                },
            };
        });

        return {
            type: "competitive",
            generatedAt: new Date().toISOString(),
            summary: {
                categoriesAnalyzed: categoryAnalysis.length,
                totalProducts: products.length,
            },
            data: {
                categoryAnalysis,
                allProducts: products,
            },
            insights: generateCompetitiveInsights(categoryAnalysis),
        };
    } catch (error) {
        console.error("Competitive report generation failed:", error);
        throw new Error("Failed to generate competitive report");
    }
}

// Insight generation helpers
function generateInventoryInsights(products, lowStock, outOfStock, overstock) {
    const insights = [];

    if (outOfStock.length > 0) {
        insights.push(`⚠️ ${outOfStock.length} products are out of stock. Immediate reorder required.`);
    }

    if (lowStock.length > 0) {
        insights.push(`📉 ${lowStock.length} products are below reorder point. Plan restocking soon.`);
    }

    if (overstock.length > 0) {
        insights.push(`📦 ${overstock.length} products are overstocked. Consider promotions to reduce inventory.`);
    }

    const stockTurnover = products.length > 0 ? (products.filter(p => p.stock > 0).length / products.length) * 100 : 0;
    insights.push(`📊 Stock availability: ${stockTurnover.toFixed(1)}% of products are in stock.`);

    return insights;
}

function generateMarginInsights(products, avgMargin) {
    const insights = [];

    insights.push(`💰 Average profit margin: ${avgMargin.toFixed(2)}%`);

    const highMarginCount = products.filter(p => p.marginPercent > 50).length;
    if (highMarginCount > 0) {
        insights.push(`✨ ${highMarginCount} products have excellent margins (>50%). Focus on promoting these.`);
    }

    const lowMarginCount = products.filter(p => p.marginPercent < 20).length;
    if (lowMarginCount > 0) {
        insights.push(`⚠️ ${lowMarginCount} products have low margins (<20%). Review pricing or costs.`);
    }

    return insights;
}

function generateSalesInsights(products, totalRevenue) {
    const insights = [];

    insights.push(`💵 Total potential revenue: $${totalRevenue.toLocaleString()}`);

    const top20Percent = Math.ceil(products.length * 0.2);
    const top20Revenue = products
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, top20Percent)
        .reduce((sum, p) => sum + p.revenue, 0);

    const paretoPercent = (top20Revenue / totalRevenue) * 100;
    insights.push(`📈 Top 20% of products generate ${paretoPercent.toFixed(1)}% of revenue (Pareto principle).`);

    return insights;
}

function generateCompetitiveInsights(categoryAnalysis) {
    const insights = [];

    const sortedByMargin = [...categoryAnalysis].sort((a, b) => b.avgMargin - a.avgMargin);

    if (sortedByMargin.length > 0) {
        insights.push(`🏆 Best margin category: ${sortedByMargin[0].category} (${sortedByMargin[0].avgMargin.toFixed(1)}%)`);
        insights.push(`📉 Lowest margin category: ${sortedByMargin[sortedByMargin.length - 1].category} (${sortedByMargin[sortedByMargin.length - 1].avgMargin.toFixed(1)}%)`);
    }

    return insights;
}
