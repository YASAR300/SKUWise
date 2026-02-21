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

        if (!prisma?.alert) {
            console.error("❌ Prisma Client Error: 'alert' model not found. Running prisma generate is required.");
            return NextResponse.json({
                error: "Prisma Client out of sync",
                details: "The 'alert' model is not recognized by the Prisma Client. Please re-deploy."
            }, { status: 500 });
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
        console.error("❌ Fetch Alerts Error:", {
            message: error.message,
            code: error.code, // Prisma error codes
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });

        // Return a more descriptive error if it's likely a database issue
        const isDbError = error.message?.includes("Prisma") || error.code?.startsWith("P");
        return NextResponse.json({
            error: "Failed to fetch alerts",
            details: isDbError ? "Database connection or schema mismatch. Verify migrations." : error.message
        }, { status: 500 });
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
