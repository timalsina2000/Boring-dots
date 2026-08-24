import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boring Dots",
  description: "A boring project",
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
