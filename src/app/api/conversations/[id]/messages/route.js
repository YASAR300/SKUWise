import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Ensure conversation belongs to user
        const conversation = await prisma.conversation.findFirst({
            where: { id, userId: session.user.id }
        });

        if (!conversation) {
            return NextResponse.json({ error: "Unauthorized or not found" }, { status: 404 });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: "asc" }
        });

        return NextResponse.json({ messages });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
