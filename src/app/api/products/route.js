import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        
        // Pagination params
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Filter params
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category") || "all";
        const sortBy = searchParams.get("sortBy") || "updatedAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        // Query construction
        const where = {
            AND: [
                search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { category: { contains: search, mode: 'insensitive' } },
                    ]
                } : {},
                category !== "all" ? { category: category } : {},
            ]
        };

        const [products, totalItems] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                take: limit,
                skip: skip,
            }),
            prisma.product.count({ where })
        ]);

        return NextResponse.json({
            products,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error("Fetch Products Error:", error);
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

        let product;
        try {
            // Attempt full creation with new fields
            product = await prisma.product.create({
                data: {
                    name: String(name),
                    category: String(category),
                    price: parseFloat(price),
                    stock: parseInt(stock),
                    cost: cost ? parseFloat(cost) : parseFloat(price) * 0.7,
                    reorderPoint: reorderPoint ? parseInt(reorderPoint) : 10,
                    rating: 5.0,
                }
            });
        } catch (initialError) {
            // Fallback: If 'cost' or other new fields are not in the Client yet
            console.warn("⚠️ Prisma Client Sync Error. Retrying without 'cost' field:", initialError.message);
            product = await prisma.product.create({
                data: {
                    name: String(name),
                    category: String(category),
                    price: parseFloat(price),
                    stock: parseInt(stock),
                    rating: 5.0,
                }
            });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Product creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
