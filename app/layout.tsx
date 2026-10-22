import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Then vs. Now Founder Bingo",
  description: "Fast Forward Academy cohort founder bingo",
};

export const viewport: Viewport = {
  themeColor: "#ECF5EC",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
