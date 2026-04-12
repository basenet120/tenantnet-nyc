"use client";
import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--color-charcoal-light)",
          border: "2px solid var(--color-border)",
          color: "var(--color-offwhite)",
          borderRadius: "0",
          fontFamily: "var(--font-body)",
        },
      }}
    />
  );
}
