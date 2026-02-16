import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as XLSX from "xlsx";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("image"); // Kept name 'image' for frontend compatibility

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
            // XLSX Handling: Parse buffer to CSV for Gemini to digest easily
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const csvData = XLSX.utils.sheet_to_csv(firstSheet);

            contentParts.push(csvData);
            contextMessage = "Analyze this spreadsheet data (provided as CSV) and extract the inventory assets.";
        } else if (mimeType === "application/pdf") {
            // PDF Handling: Send raw buffer to Gemini 1.5 Flash
            contentParts.push({
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: "application/pdf",
                },
            });
            contextMessage = "Scan this PDF document for a product list or catalog.";
        } else {
            // Image Handling (Default)
            contentParts.push({
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.type || "image/jpeg",
                },
            });
            contextMessage = "Scan this image of a product list or screenshot.";
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Act as an expert data extractor. ${contextMessage}
            Extract the following fields for each product identified:
            - name (The name of the item)
            - category (The category/sector, infer if not clear)
            - price (The selling price as a number, ignore currency symbols)
            - stock (The quantity on hand as a number)
            - cost (The base unit cost. Look for 'wholesale', 'purchase price', etc. If not found, use null)

            Return ONLY a valid JSON array of objects.
            Example: [{"name": "Item A", "category": "General", "price": 100, "stock": 5, "cost": 70}]
        `;

        const result = await model.generateContent([prompt, ...contentParts]);
        const responseText = result.response.text();

        // Clean up markdown code blocks if Gemini includes them
        const jsonContent = responseText.replace(/```json|```/g, "").trim();
        const extractedData = JSON.parse(jsonContent);

        return NextResponse.json({ products: extractedData });
    } catch (error) {
        console.error("Multi-Format Scan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
