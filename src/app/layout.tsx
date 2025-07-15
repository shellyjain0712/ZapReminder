import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import Providers from "@/components/Provider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Smart Reminder",
  description: "Never miss a task again with Smart Reminder",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
