import { NextRequest, NextResponse } from "next/server";
import { processDueReminders } from "@/services/reminder-service";

export async function GET(request: NextRequest) {
  try {
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret) {
      const providedSecret = request.headers.get("x-cron-secret");

      if (providedSecret !== expectedSecret) {
        return NextResponse.json(
          { ok: false, message: "Unauthorized cron request." },
          { status: 401 }
        );
      }
    }

    const result = await processDueReminders();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Reminder processing failed.",
      },
      { status: 500 }
    );
  }
}