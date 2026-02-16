import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const conversations = await prisma.conversation.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
            include: {
                _count: {
                    select: { messages: true }
                }
            }
        });

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error("List Conversations Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, persona, mode } = await req.json();
        const conversation = await prisma.conversation.create({
            data: {
                userId: session.user.id,
                title: title || "New Strategy",
                persona: persona || "growth",
                mode: mode || "quick",
            }
        });
        return NextResponse.json({ conversation });
    } catch (error) {
        console.error("Create Conversation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
