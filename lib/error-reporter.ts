/**
 * lib/error-reporter.ts
 *
 * Lightweight, dependency-free error reporter.
 * Sends a structured payload to /api/report-error via navigator.sendBeacon
 * (falls back to fetch) so the report fires even during page unload.
 *
 * Context (route, component) is attached to every report.
 */

export interface ErrorContext {
  route?: string;
  component?: string;
  extra?: Record<string, unknown>;
}

export interface ErrorPayload {
  type: "caught-error" | "uncaught-error" | "unhandled-rejection";
  message: string;
  digest?: string;
  stack?: string;
  route?: string;
  component?: string;
  extra?: Record<string, unknown>;
  timestamp: string;
  userAgent?: string;
}

/** Report a caught error (React error boundary or try/catch). */
export function reportError(
  error: Error & { digest?: string },
  ctx: ErrorContext = {},
): void {
  if (typeof window === "undefined") return; // SSR — skip

  const payload: ErrorPayload = {
    type: "caught-error",
    message: error.message,
    digest: error.digest,
    stack: error.stack,
    route: ctx.route ?? window.location.pathname,
    component: ctx.component,
    extra: ctx.extra,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };

  _send(payload);
}

/** Install global window.onerror + unhandledrejection handlers. */
export function installGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;

  window.onerror = (message, source, lineno, colno, error) => {
    const payload: ErrorPayload = {
      type: "uncaught-error",
      message: String(message),
      stack: error?.stack,
      route: window.location.pathname,
      extra: { source, lineno, colno },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    _send(payload);
    return false; // let default browser handling proceed
  };

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const payload: ErrorPayload = {
      type: "unhandled-rejection",
      message:
        reason instanceof Error
          ? reason.message
          : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      route: window.location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    _send(payload);
  });
}

// ─── internal ────────────────────────────────────────────────────────────────

function _send(payload: ErrorPayload): void {
  try {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      // Preferred: fires even during page unload
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/report-error", blob);
    } else {
      // Fallback: fire-and-forget fetch
      fetch("/api/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Swallow — reporting must never throw
      });
    }
  } catch {
    // Swallow — reporting must never throw
  }
}
