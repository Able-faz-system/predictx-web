"use client";

import { useEffect } from "react";
import { installGlobalErrorHandlers } from "@/lib/error-reporter";

/**
 * Mounts window.onerror + unhandledrejection handlers once on the client.
 * Renders nothing — drop it anywhere in the layout tree.
 */
export function ErrorHandlerMount() {
  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);

  return null;
}
