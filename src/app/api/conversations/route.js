import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/conversations - List all conversations
export async function GET() {
    try {
        const conversations = await prisma.conversation.findMany({
            orderBy: { updatedAt: "desc" },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                    take: 1, // Just get the first message for the title
                },
            },
        });

        // Format response
        const formatted = conversations.map((conv) => ({
            id: conv.id,
            title: conv.title,
            persona: conv.persona,
            mode: conv.mode,
            totalQueries: conv.totalQueries,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            firstMessage: conv.messages[0]?.content || "",
        }));

        return NextResponse.json({ conversations: formatted });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversations" },
            { status: 500 }
        );
    }
}

// POST /api/conversations - Create new conversation
export async function POST(request) {
    try {
        const { persona = "growth", mode = "quick", title } = await request.json();

        const conversation = await prisma.conversation.create({
            data: {
                title: title || "New Conversation",
                persona,
                mode,
            },
        });

        return NextResponse.json({ conversation });
    } catch (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json(
            { error: "Failed to create conversation" },
            { status: 500 }
        );
    }
}
