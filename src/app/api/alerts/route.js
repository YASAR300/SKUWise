import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const alerts = await prisma.alert.findMany({
            where: {
                userId: session.user.id,
                dismissed: false
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(alerts);
    } catch (error) {
        console.error("Fetch Alerts Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { alertId, dismissed } = await req.json();

        const updated = await prisma.alert.update({
            where: { id: alertId, userId: session.user.id },
            data: { dismissed: !!dismissed }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update Alert Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.alert.deleteMany({
            where: { userId: session.user.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Clear Alerts Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
