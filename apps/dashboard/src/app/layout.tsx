import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "@/context/useDemoContext";
import { AuthProvider } from "@/context/useAuthContext";
import { LanguageProvider } from "@/context/useLanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FedSOC AI: Collaborative Cyber Threat Detection",
  description: "Secure, decentralized cybersecurity threat intelligence platform powered by Federated Learning and Llama 3.1",
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
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <DemoProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </DemoProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
