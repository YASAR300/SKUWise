import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateWithRetry } from "@/lib/api-utils";
import { getGeminiModel } from "@/lib/gemini";

// Strictly enforcing gemini-2.5-flash for the rotation factory

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch user data (products, sales, stock levels)
        const products = await prisma.product.findMany({
            where: { userId: session.user.id },
            include: {
                salesData: {
                    orderBy: { date: 'desc' },
                    take: 7 // Last 7 sales records
                }
            }
        });

        if (products.length === 0) {
            return NextResponse.json({ message: "No products found to analyze." });
        }

        // 2. Prepare data for Gemini
        const dataSummary = products.map(p => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            reorderPoint: p.reorderPoint || 10,
            recentSalesCount: p.salesData.length,
            category: p.category
        }));

        // 3. Prompt Gemini to identify risks and opportunities
        const prompt = `
            Analyze the following product inventory and sales data for a business owner.
            Identify 3-5 critical "Nudges" (Alerts). 
            Each alert must be either a "risk", "warning", or "opportunity".
            
            Data: ${JSON.stringify(dataSummary)}
            
            Return ONLY a valid JSON array of objects with these keys:
            - type: "risk" | "opportunity" | "warning"
            - severity: "low" | "medium" | "high" | "critical"
            - title: Short catchy title
            - message: Helpful description (max 15 words)
            - skuId: The product ID if applicable, else null
            
            Example:
            [{"type": "risk", "severity": "critical", "title": "Stockout Imminent", "message": "iPhone X stock is at 2, below reorder point of 10.", "skuId": "sku_123"}]
        `;

        const result = await generateWithRetry(getGeminiModel, prompt);
        const responseText = result.response.text();

        // Extract JSON (handle potential markdown formatting)
        const jsonMatch = responseText.match(/\[.*\]/s);
        const alertsData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        // 4. Save new alerts to DB
        const createdAlerts = await Promise.all(
            alertsData.map(alert =>
                prisma.alert.create({
                    data: {
                        userId: session.user.id,
                        type: alert.type,
                        severity: alert.severity,
                        title: alert.title,
                        message: alert.message,
                        skuId: alert.skuId,
                    }
                })
            )
        );

        return NextResponse.json({ success: true, count: createdAlerts.length });
    } catch (error) {
        console.error("Alert Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
