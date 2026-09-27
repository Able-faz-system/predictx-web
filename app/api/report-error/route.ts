import { type NextRequest, NextResponse } from "next/server";
import type { ErrorPayload } from "@/lib/error-reporter";

/**
 * POST /api/report-error
 *
 * Receives error payloads from the client-side error reporter.
 * In production this would forward to an observability backend
 * (e.g. Vercel Log Drains, Sentry, Datadog).
 * For now it logs to the server console (visible in Vercel Function logs).
 */
export async function POST(request: NextRequest) {
  try {
    const payload: ErrorPayload = await request.json();

    // Sanitise — only log known fields to avoid log injection
    console.error("[ErrorReport]", {
      type: payload.type,
      message: payload.message?.slice(0, 500),
      digest: payload.digest,
      route: payload.route,
      component: payload.component,
      timestamp: payload.timestamp,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    // Malformed body — still return 200 so the client doesn't retry
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
