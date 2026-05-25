import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ToastProvider from "@/components/providers/ToastProvider";

export const metadata: Metadata = {
  title: "StaySaga Hotels | StaySaga Travel",
  description:
    "Khám phá khách sạn và homestay thật với thương hiệu StaySaga, giao diện sang trọng và trải nghiệm đặt chỗ hiện đại.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className="font-sans h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ToastProvider />
      </body>
    </html>
  );
}
