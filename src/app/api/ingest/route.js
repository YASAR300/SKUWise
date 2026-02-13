import { prisma } from "@/lib/prisma";
import qdrantClient from "@/lib/qdrant";
import { parseFile, normalizeData } from "@/lib/data-parser";
import { getEmbedding, createContentString } from "@/lib/embeddings";

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
                    const product = await prisma.product.upsert({
                        where: { id: item.id || "non-existent-cuid" },
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

                    // Store in Qdrant
                    const content = createContentString(item, "product");
                    const vector = await getEmbedding(content);

                    await qdrantClient.upsert("products", {
                        wait: true,
                        points: [
                            {
                                id: product.id,
                                vector: vector,
                                payload: { ...item, type: "product", content }
                            }
                        ]
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
                        const review = await prisma.review.create({
                            data: {
                                productId: product.id,
                                rating: item.rating,
                                comment: item.comment,
                                date: item.date,
                            }
                        });

                        // Store in Qdrant
                        const content = createContentString(item, "review");
                        const vector = await getEmbedding(content);

                        await qdrantClient.upsert("reviews", {
                            wait: true,
                            points: [
                                {
                                    id: review.id,
                                    vector: vector,
                                    payload: { ...item, productId: product.id, type: "review", content }
                                }
                            ]
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
                        const sale = await prisma.salesData.create({
                            data: {
                                productId: product.id,
                                unitsSold: item.unitsSold,
                                revenue: item.revenue,
                                date: item.date,
                            }
                        });

                        // Store in Qdrant
                        const content = createContentString(item, "sales");
                        const vector = await getEmbedding(content);

                        await qdrantClient.upsert("sales", {
                            wait: true,
                            points: [
                                {
                                    id: sale.id,
                                    vector: vector,
                                    payload: { ...item, productId: product.id, type: "sales", content }
                                }
                            ]
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
