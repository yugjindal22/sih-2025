import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Providers from "@/components/providers";
import { PWARegister } from "@/components/pwa-register";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GeoVision Observatory - ISRO Earth Observation Platform",
  description:
    "AI-Powered Multimodal Platform for ISRO Earth Observation Data Analysis - Smart India Hackathon 2025",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GeoVision ISRO",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <PWARegister />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
