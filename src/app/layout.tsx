import type { Metadata, Viewport } from "next";
import { DM_Sans, Archivo_Black } from "next/font/google";
import { ToasterProvider } from "@/components/toaster-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { AppFooter } from "@/components/app-footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { NavigationCursor } from "@/components/navigation-cursor";
import { getAppStrings } from "@/lib/get-app-strings";
import "./globals.css";

// DM Sans is our body font. shadcn primitives use font-sans via
// Tailwind, and we map font-sans -> DM Sans in globals.css's @theme inline.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1a1a",
};

// Canonical origin used to resolve the opengraph / twitter image URLs into
// absolute links. iMessage, Slack, and other link unfurlers require
// absolute URLs for og:image — without this they fall back to whatever
// default the hosting platform serves (Vercel's generic icon in our case).
// Override via NEXT_PUBLIC_SITE_URL when deploying to a different domain.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://tenantnet.nyc");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TENANTNET.NYC",
    template: "%s | TENANTNET.NYC",
  },
  description:
    "Private tenant forums for NYC apartment buildings — report issues, document disputes, connect with neighbors.",
  // Do NOT declare `icons` here. Next.js's file-based convention picks up
  // src/app/favicon.ico, src/app/icon.svg, and src/app/apple-icon.svg and
  // wires them with the hashed URLs it actually serves them at. An
  // explicit `icons: { ... }` block with plain paths will silently replace
  // those links with broken 404s.
  openGraph: {
    title: "TENANTNET.NYC",
    description:
      "Your building's private forum — report issues, document disputes, connect with neighbors.",
    siteName: "TENANTNET.NYC",
    url: siteUrl,
    type: "website",
    // The opengraph-image.tsx route in this directory is auto-wired by
    // Next.js and added to og:image, but we list it explicitly so the
    // resolved URL shows up in every share preview.
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TENANTNET.NYC — Private tenant forums for NYC apartment buildings",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TENANTNET.NYC",
    description:
      "Your building's private forum — report issues, document disputes, connect with neighbors.",
    images: ["/twitter-image"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { strings, lang, dir } = await getAppStrings();

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${dmSans.variable} ${archivoBlack.variable}`}
    >
      <head>
        <link rel="dns-prefetch" href="//centerbeam.proxy.rlwy.net" />
        <link rel="dns-prefetch" href="//fnoiyvxqwrb0zrdo.public.blob.vercel-storage.com" />
      </head>
      <body>
        <I18nProvider strings={strings} lang={lang}>
          <NavigationCursor />
          <Breadcrumb />
          <div className="pb-16">
            {children}
          </div>
          <AppFooter />
        </I18nProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
