import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as cache from "@/lib/cache";
import { indexToQdrant } from "@/lib/search-utils";

const CACHE_TTL = 60000; // 1 minute for products

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const cacheKey = `products_${session.user.id}_${searchParams.toString()}`;

        const cachedResponse = cache.get(cacheKey);
        if (cachedResponse) return NextResponse.json(cachedResponse);

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
            userId: session.user.id,
            AND: [
                search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { category: { contains: search, mode: 'insensitive' } },
                    ]
                } : {},
                category !== "all" ? { category: { equals: category, mode: 'insensitive' } } : {},
            ]
        };

        const [products, totalItems, categories] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                take: limit,
                skip: skip,
                select: {
                    id: true,
                    name: true,
                    category: true,
                    price: true,
                    stock: true,
                    imageUrl: true,
                    updatedAt: true,
                    reorderPoint: true
                }
            }),
            prisma.product.count({ where }),
            prisma.product.findMany({
                where: { userId: session.user.id },
                select: { category: true },
                distinct: ['category'],
            })
        ]);

        const responseData = {
            products,
            categories: [...new Set(categories.map(c => {
                const cat = c.category || "General";
                return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
            }))].sort(),
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                limit
            }
        };

        cache.set(cacheKey, responseData, CACHE_TTL);
        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Fetch Products Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, category, price, stock, cost, reorderPoint } = body;

        // Basic validation
        if (!name || !category || price === undefined || stock === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let product;
        try {
            const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
            // Attempt full creation with new fields
            product = await prisma.product.create({
                data: {
                    userId: session.user.id,
                    name: String(name),
                    category: normalizedCategory,
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
                    userId: session.user.id,
                    name: String(name),
                    category: String(category),
                    price: parseFloat(price),
                    stock: parseInt(stock),
                    rating: 5.0,
                }
            });
        }

        // Index to Qdrant for immediate RAG availability
        indexToQdrant(product, "product");

        // Invalidate products cache for this user
        cache.clear();

        return NextResponse.json(product);
    } catch (error) {
        console.error("Product creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
