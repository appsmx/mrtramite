import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mr. Trámite — Gestoría profesional de trámites",
  description:
    "Gestoría de Visa Americana, pasaporte, INE, licencia y más. No pagas hasta tener tu cita confirmada. Mr. Trámite se encarga de todo.",
  keywords: [
    "Mr. Trámite",
    "gestoría",
    "visa americana",
    "DS-160",
    "pasaporte mexicano",
    "INE",
    "licencia de conducir",
    "cita consular",
  ],
  authors: [{ name: "Mr. Trámite" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo_icon.png",
    apple: "/logo_icon.png",
  },
  openGraph: {
    title: "Mr. Trámite — Gestoría profesional",
    description:
      "No pagas hasta tener tu cita confirmada. Visa, pasaporte, INE y más.",
    siteName: "Mr. Trámite",
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mr. Trámite — Gestoría profesional",
    description:
      "No pagas hasta tener tu cita confirmada. Visa, pasaporte, INE y más.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B4F72",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
