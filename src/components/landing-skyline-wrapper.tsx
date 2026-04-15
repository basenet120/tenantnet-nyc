"use client";

import dynamic from "next/dynamic";

// Three.js skyline is heavy — lazy-load only on the client. This wrapper
// lets the landing page (a Server Component) import it without triggering
// SSR of Three.js.
export const LandingSkyline = dynamic(
  () => import("./landing-skyline").then((m) => m.LandingSkyline),
  { ssr: false },
);
