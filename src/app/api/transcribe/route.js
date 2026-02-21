import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateWithRetry } from "@/lib/api-utils";
import { getGeminiModel } from "@/lib/gemini";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const audioBlob = formData.get("audio");

        if (!audioBlob) {
            return NextResponse.json({ error: "No audio provided" }, { status: 400 });
        }

        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = audioBlob.type || "audio/webm";

        const result = await generateWithRetry(getGeminiModel, [
            {
                inlineData: {
                    data: base64Audio,
                    mimeType: mimeType,
                }
            },
            {
                text: "Transcribe the speech in this audio exactly as spoken. Return only the transcribed text, nothing else. If there is no speech, return an empty string."
            }
        ]);

        const transcript = result.response.text().trim();
        return NextResponse.json({ transcript });

    } catch (error) {
        console.error("Transcription error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
