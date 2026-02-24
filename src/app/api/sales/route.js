import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET: Fetch sales for a specific product
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");
        if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

        // Ensure product belongs to the user
        const product = await prisma.product.findFirst({ where: { id: productId, userId: session.user.id } });
        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        const sales = await prisma.salesData.findMany({
            where: { productId },
            orderBy: { date: "desc" },
        });

        return NextResponse.json({ sales });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add a new sales record
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { productId, unitsSold, revenue, date } = await req.json();
        if (!productId || unitsSold === undefined || revenue === undefined) {
            return NextResponse.json({ error: "productId, unitsSold, and revenue are required" }, { status: 400 });
        }

        // Ensure product belongs to user
        const product = await prisma.product.findFirst({ where: { id: productId, userId: session.user.id } });
        if (!product) return NextResponse.json({ error: "Product not found or not yours" }, { status: 404 });

        const sale = await prisma.salesData.create({
            data: {
                productId,
                unitsSold: parseInt(unitsSold),
                revenue: parseFloat(revenue),
                date: date ? new Date(date) : new Date(),
            },
        });

        return NextResponse.json({ sale });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a sales record
export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const saleId = searchParams.get("id");
        if (!saleId) return NextResponse.json({ error: "id required" }, { status: 400 });

        // Verify ownership via product relation
        const sale = await prisma.salesData.findFirst({
            where: { id: saleId },
            include: { product: true },
        });
        if (!sale || sale.product.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
        }

        await prisma.salesData.delete({ where: { id: saleId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
