import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thisari — Kapruka Shopping Assistant",
  description:
    "Thisari (තිසරි) is your AI-powered Kapruka shopping assistant. Discover products, check delivery, and complete orders — all through a friendly chat in English, Sinhala, or Tanglish.",
  keywords: [
    "Kapruka",
    "Sri Lanka",
    "shopping assistant",
    "AI",
    "gifts",
    "delivery",
    "Sinhala",
  ],
  openGraph: {
    title: "Thisari — Kapruka Shopping Assistant",
    description:
      "Your AI-powered Kapruka shopping assistant. Chat in English, Sinhala, or Tanglish.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

