import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ออมกัน (AomGun) — จดง่าย ออมได้จริง",
  description: "แอปจัดการรายรับ-รายจ่าย ตั้งงบประมาณ และวิเคราะห์การใช้เงินกับน้องออม",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ออมกัน",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFD64F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ag-offwhite text-ag-text">
        {children}
      </body>
    </html>
  );
}
