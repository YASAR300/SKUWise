import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as cache from "@/lib/cache";

const CACHE_TTL = 300000; // 5 minutes for usage

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch usage records for the current user
        const usageRecords = await prisma.usageRecord.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });
        const cacheKey = `usage_${session.user.id}`;
        const cachedResponse = cache.get(cacheKey);
        if (cachedResponse) return NextResponse.json(cachedResponse);

        // ... calculate aggregates ...
        const totalTokens = usageRecords.reduce((sum, r) => sum + r.totalTokens, 0);
        const totalCost = usageRecords.reduce((sum, r) => sum + r.cost, 0);

        // Group by model
        const modelBreakdown = usageRecords.reduce((acc, r) => {
            if (!acc[r.model]) acc[r.model] = { tokens: 0, cost: 0, count: 0 };
            acc[r.model].tokens += r.totalTokens;
            acc[r.model].cost += r.cost;
            acc[r.model].count += 1;
            return acc;
        }, {});

        // Group by day (last 30 days)
        const dailyUsage = usageRecords.reduce((acc, r) => {
            const date = r.createdAt.toISOString().split('T')[0];
            if (!acc[date]) acc[date] = { tokens: 0, cost: 0 };
            acc[date].tokens += r.totalTokens;
            acc[date].cost += r.cost;
            return acc;
        }, {});

        const responseData = {
            aggregates: {
                totalTokens,
                totalCost,
                recordCount: usageRecords.length
            },
            modelBreakdown,
            dailyUsage: Object.entries(dailyUsage)
                .map(([date, data]) => ({ date, ...data }))
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(-30),
            recentRecords: usageRecords.slice(0, 10)
        };

        cache.set(cacheKey, responseData, CACHE_TTL);
        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Fetch Usage Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
