import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://portfoliodb-three.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Portfolio db.tviezy",
  description:
    "Portfolio of Daniil Bautin (db.tviezy) — motion design, interfaces, and visual systems.",
  applicationName: "Portfolio db.tviezy",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
  openGraph: {
    title: "Portfolio db.tviezy",
    description:
      "Motion design, interfaces, and visual systems by Daniil Bautin.",
    url: siteUrl,
    siteName: "Portfolio db.tviezy",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio db.tviezy",
    description:
      "Motion design, interfaces, and visual systems by Daniil Bautin.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-[var(--text)]">
        <div className="flex flex-grow flex-col">{children}</div>
      </body>
    </html>
  );
}
