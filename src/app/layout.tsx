import type { Metadata, Viewport } from "next";
import { DM_Sans, Archivo_Black } from "next/font/google";
import { ToasterProvider } from "@/components/toaster-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { getAppStrings } from "@/lib/get-app-strings";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "TENANTNET.NYC",
    template: "%s | TENANTNET.NYC",
  },
  description: "Private tenant forums for NYC apartment buildings — report issues, document disputes, connect with neighbors.",
  openGraph: {
    title: "TENANTNET.NYC",
    description: "Your building's private forum — report issues, document disputes, connect with neighbors.",
    siteName: "TENANTNET.NYC",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { strings, lang } = await getAppStrings();

  return (
    <html
      lang={lang}
      className={`${dmSans.variable} ${archivoBlack.variable}`}
    >
      <head>
        <link rel="dns-prefetch" href="//centerbeam.proxy.rlwy.net" />
        <link rel="dns-prefetch" href="//fnoiyvxqwrb0zrdo.public.blob.vercel-storage.com" />
      </head>
      <body>
        <I18nProvider strings={strings} lang={lang}>
          {children}
        </I18nProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
