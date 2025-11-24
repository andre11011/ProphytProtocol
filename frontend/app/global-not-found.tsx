import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import Link from "next/link";
import { Button } from "@heroui/button";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s`,
  },
  description: siteConfig.description,
  keywords: [
    "Next.js",
    "React",
    "Tailwind CSS",
    "TypeScript",
    "Web App",
    siteConfig.name,
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  generator: "Next.js 15",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function GlobalNotFound() {
  return (
    <html suppressHydrationWarning lang="en">
      <body>
        <div className="flex items-center justify-center h-svh">
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center gap-2 mb-4">
              <h1 className="text-7xl text-black">404</h1>
              <p>This page does not exist.</p>
            </div>
            <Link href="/">
              <Button>Go back home</Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
