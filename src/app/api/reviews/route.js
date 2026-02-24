import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET: Fetch reviews for a product
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");
        if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

        const product = await prisma.product.findFirst({ where: { id: productId, userId: session.user.id } });
        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        const reviews = await prisma.review.findMany({
            where: { productId },
            orderBy: { date: "desc" },
        });

        return NextResponse.json({ reviews });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add a new review
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { productId, rating, comment, date } = await req.json();
        if (!productId || rating === undefined) {
            return NextResponse.json({ error: "productId and rating are required" }, { status: 400 });
        }
        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
        }

        const product = await prisma.product.findFirst({ where: { id: productId, userId: session.user.id } });
        if (!product) return NextResponse.json({ error: "Product not found or not yours" }, { status: 404 });

        const review = await prisma.review.create({
            data: {
                productId,
                rating: parseInt(rating),
                comment: comment || null,
                date: date ? new Date(date) : new Date(),
            },
        });

        return NextResponse.json({ review });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a review
export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const reviewId = searchParams.get("id");
        if (!reviewId) return NextResponse.json({ error: "id required" }, { status: 400 });

        const review = await prisma.review.findFirst({
            where: { id: reviewId },
            include: { product: true },
        });
        if (!review || review.product.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
        }

        await prisma.review.delete({ where: { id: reviewId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
