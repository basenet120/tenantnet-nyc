import type { Metadata, Viewport } from "next";
import { DM_Sans, Archivo_Black } from "next/font/google";
import { ToasterProvider } from "@/components/toaster-provider";
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
  description: "Tenant forum and issue tracker for 449 West 125th Street, Harlem NYC",
  openGraph: {
    title: "TENANTNET.NYC",
    description: "Your building's private forum — report issues, document disputes, connect with neighbors.",
    siteName: "TENANTNET.NYC",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${archivoBlack.variable}`}
    >
      <head>
        <link rel="dns-prefetch" href="//centerbeam.proxy.rlwy.net" />
        <link rel="dns-prefetch" href="//fnoiyvxqwrb0zrdo.public.blob.vercel-storage.com" />
      </head>
      <body>
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
