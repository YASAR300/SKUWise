import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 100
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function POST(req) {
    try {
        const body = await req.json();
        const { name, category, price, stock, cost, reorderPoint } = body;

        // Basic validation
        if (!name || !category || price === undefined || stock === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                id: `id_${Date.now()}`,
                name,
                category,
                price: parseFloat(price),
                stock: parseInt(stock),
                cost: parseFloat(cost || price * 0.7),
                reorderPoint: parseInt(reorderPoint || 10),
                rating: 5.0, // Default rating
            }
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("Product creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
