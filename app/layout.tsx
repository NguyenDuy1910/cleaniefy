import type { Metadata } from "next";
import { Manrope, Lora } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

export const metadata: Metadata = {
  title: { default: "Cleanie — Get booked, not buried in setup", template: "%s | Cleanie" },
  description: "A conversion-first booking page for cleaning businesses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${manrope.variable} ${lora.variable}`}><body>{children}</body></html>;
}
