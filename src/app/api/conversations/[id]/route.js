import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/conversations/[id] - Get specific conversation with all messages
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ conversation });
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversation" },
            { status: 500 }
        );
    }
}

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        try {
            await prisma.conversation.delete({
                where: { id },
            });
        } catch (e) {
            // P2025 is Prisma's code for "Record to delete does not exist"
            // We can safely ignore this as the desired state (deletion) is achieved.
            if (e.code !== 'P2025') {
                throw e;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return NextResponse.json(
            { error: "Failed to delete conversation" },
            { status: 500 }
        );
    }
}
