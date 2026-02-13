import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// POST /api/conversations/[id]/messages - Add message to conversation
export async function POST(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();

        const {
            role, // "user" or "assistant"
            content,
            query,
            mode,
            persona,
            sources,
            clarifications,
        } = body;

        // Create message
        const message = await prisma.message.create({
            data: {
                conversationId: id,
                role,
                content,
                query: role === "user" ? query : null,
                mode: role === "user" ? mode : null,
                persona: role === "user" ? persona : null,
                sources: role === "assistant" ? sources : null,
                clarifications: role === "assistant" ? clarifications : null,
            },
        });

        // Update conversation totalQueries if user message
        if (role === "user") {
            await prisma.conversation.update({
                where: { id },
                data: {
                    totalQueries: { increment: 1 },
                    updatedAt: new Date(),
                },
            });
        }

        return NextResponse.json({ message });
    } catch (error) {
        console.error("Error adding message:", error);
        return NextResponse.json(
            { error: "Failed to add message" },
            { status: 500 }
        );
    }
}
