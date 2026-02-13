import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Assuming this exists or needs to be created
import { parseFile, normalizeData } from "@/lib/data-parser";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll("files");
        const type = formData.get("type") || "product";

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        let totalSaved = 0;

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const rawData = await parseFile(buffer, file.type);
            const normalizedData = normalizeData(rawData, type);

            if (type === "product") {
                for (const item of normalizedData) {
                    await prisma.product.upsert({
                        where: { id: item.id || "non-existent-cuid" }, // Or search by name
                        create: {
                            name: item.name,
                            category: item.category,
                            price: item.price,
                            rating: item.rating,
                            stock: item.stock,
                        },
                        update: {
                            category: item.category,
                            price: item.price,
                            rating: item.rating,
                            stock: item.stock,
                        },
                    });
                    totalSaved++;
                }
            }

            else if (type === "review") {
                for (const item of normalizedData) {
                    // Find product by name to get ID
                    const product = await prisma.product.findFirst({
                        where: { name: { contains: item.productName, mode: 'insensitive' } }
                    });

                    if (product) {
                        await prisma.review.create({
                            data: {
                                productId: product.id,
                                rating: item.rating,
                                comment: item.comment,
                                date: item.date,
                            }
                        });
                        totalSaved++;
                    }
                }
            }

            else if (type === "sales") {
                for (const item of normalizedData) {
                    const product = await prisma.product.findFirst({
                        where: { name: { contains: item.productName, mode: 'insensitive' } }
                    });

                    if (product) {
                        await prisma.salesData.create({
                            data: {
                                productId: product.id,
                                unitsSold: item.unitsSold,
                                revenue: item.revenue,
                                date: item.date,
                            }
                        });
                        totalSaved++;
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `${totalSaved} records processed from ${files.length} files.`,
            count: totalSaved
        });

    } catch (error) {
        console.error("Ingestion Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
