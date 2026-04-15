"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Sets the browser cursor to "progress" (arrow + spinner) while a Next.js
 * App Router navigation is in flight, so users get visual feedback for
 * same-app link clicks even when the page doesn't fully reload.
 *
 * Mounted once in the root layout.
 */
export function NavigationCursor() {
  const pathname = usePathname();
  const timeoutRef = useRef<number | null>(null);

  // Click listener: detect in-app link clicks and set cursor to progress
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Ignore modified clicks (new tab / middle click / etc.)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, hash links, mailto/tel, target="_blank"
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      // Same route — no navigation will happen
      const current = pathname || "/";
      if (href === current || href === current + "/") return;

      document.body.style.cursor = "progress";

      // Safety: clear after 10s even if the route never changes (e.g.,
      // error, redirect loop, or link that just opens something)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        document.body.style.cursor = "";
      }, 10000);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  // Clear the cursor when the route actually changes (navigation complete)
  useEffect(() => {
    document.body.style.cursor = "";
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname]);

  return null;
}
