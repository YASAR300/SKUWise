import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get("image");

        if (!imageFile) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Convert image to base64
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString("base64");

        // Initialize Gemini Flash (High speed, cost-effective for OCR)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Act as an expert data extractor. Scan this image of a product list, spreadsheet, or receipt.
            Extract the following fields for each product:
            - name (The name of the item)
            - category (The category or sector, if not clear, infer from the name)
            - price (The selling price as a number)
            - stock (The current quantity on hand as a number)
            - cost (The base cost, if not present, set to null)

            Return ONLY a JSON array of objects. Do not include any other text or explanation.
            Example: [{"name": "Item A", "category": "Tech", "price": 100, "stock": 50, "cost": 70}]
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: imageFile.type,
                },
            },
        ]);

        const responseText = result.response.text();

        // Clean up markdown code blocks if Gemini includes them
        const jsonContent = responseText.replace(/```json|```/g, "").trim();
        const extractedData = JSON.parse(jsonContent);

        return NextResponse.json({ products: extractedData });
    } catch (error) {
        console.error("OCR API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
