import { NextResponse } from "next/server";

/**
 * Error Logging API
 * Receives and logs client-side errors for monitoring.
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const { type, message, stack, url, timestamp } = body;

        // In a real production app, you might send this to Sentry, Logtail, or a dedicated DB table
        console.error(`[CLIENT_${type}] [${timestamp}] @ ${url}`);
        console.error(`Message: ${message}`);
        if (stack) console.error(`Stack: ${stack}`);

        // We could also save this to Prisma if we want a persistent "System Logs" dashboard later
        // Example: await prisma.systemLog.create({ data: { ... } });

        return NextResponse.json({ status: "logged" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to log" }, { status: 500 });
    }
}
