import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import * as XLSX from 'xlsx';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateWithRetry } from "@/lib/api-utils";
import { getGeminiModel } from "@/lib/gemini";

// Strictly enforcing gemini-2.5-flash for the rotation factory

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") || formData.get("image");

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = file.name?.toLowerCase() || "";
        const mimeType = file.type;

        let contentParts = [];
        let contextMessage = "Scan this document for a product list.";

        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const csvData = XLSX.utils.sheet_to_csv(firstSheet);
            contentParts.push(csvData);
            contextMessage = "Analyze this spreadsheet data (provided as CSV) and extract the inventory assets.";
        } else if (mimeType === "application/pdf") {
            contentParts.push({
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: "application/pdf",
                },
            });
            contextMessage = "Scan this PDF document for a product list or catalog.";
        } else {
            contentParts.push({
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.type || "image/jpeg",
                },
            });
            contextMessage = "Scan this image of a product list or screenshot.";
        }

        const prompt = `
            Act as an expert data extractor. ${contextMessage}
            Extract the following fields for each product identified:
            - name (The name of the item)
            - category (The category / sector, infer if not clear)
            - price (The selling price as a number, ignore currency symbols)
            - stock (The quantity on hand as a number)
            - cost (The base unit cost. Look for 'wholesale', 'purchase price', etc. If not found, use 70% of price)

            Return ONLY a valid JSON array of objects.
            Example: [{ "name": "Item B", "category": "Retail", "price": 100, "stock": 5, "cost": 70 }]
        `;

        const result = await generateWithRetry(getGeminiModel, [prompt, ...contentParts]);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("Could not find JSON array in AI response");
        const extractedData = JSON.parse(jsonMatch[0]).map(item => ({
            ...item,
            category: item.category ? (item.category.charAt(0).toUpperCase() + item.category.slice(1).toLowerCase()) : "General"
        }));

        return NextResponse.json({ products: extractedData });
    } catch (error) {
        console.error("Multi-Format Scan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
