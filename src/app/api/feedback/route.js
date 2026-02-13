import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// POST /api/feedback - Submit feedback for ML training
export async function POST(request) {
    try {
        const { messageId, wasHelpful, userFeedback } = await request.json();

        // Update message with feedback
        const message = await prisma.message.update({
            where: { id: messageId },
            data: {
                wasHelpful,
                userFeedback,
            },
        });

        // If helpful, create training example
        if (wasHelpful && message.role === "assistant") {
            // Get the user message that prompted this response
            const userMessage = await prisma.message.findFirst({
                where: {
                    conversationId: message.conversationId,
                    role: "user",
                    createdAt: { lt: message.createdAt },
                },
                orderBy: { createdAt: "desc" },
            });

            if (userMessage) {
                await prisma.trainingExample.create({
                    data: {
                        query: userMessage.query || userMessage.content,
                        context: message.sources || {},
                        persona: userMessage.persona || "growth",
                        mode: userMessage.mode || "quick",
                        response: message.content,
                        wasHelpful: true,
                        userFeedback,
                    },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return NextResponse.json(
            { error: "Failed to submit feedback" },
            { status: 500 }
        );
    }
}
