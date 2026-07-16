import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "db.tviezy | Motion Designer Portfolio",
  description: "Creating high-end motion graphics and interactive experiences.",
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
      {/* Чистый body без сторонних компонентов */}
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-[#ededed]">
        <div className="flex-grow flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}