import type { Metadata } from "next";
import { Montserrat, Noto_Sans } from "next/font/google";
import "./globals.css";
import StoreLayout from "@/components/StoreLayout";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: {
    default: "SKMEI.LB",
    template: "%s | SKMEI.LB",
  },
  description: "Shop authentic SKMEI watches in Lebanon. Digital, Analog, Sports, Smart watches with 1-year warranty and free shipping. Official dealer with genuine products.",
  keywords: "SKMEI watches, Lebanon watches, sports watches, digital watches, smart watches, authentic watches",
  authors: [{ name: "SKMEI.LB" }],
  openGraph: {
    title: "SKMEI.LB - Official SKMEI Watch Dealer",
    description: "Shop authentic SKMEI watches with 1-year warranty and free shipping",
    type: "website",
    locale: "en_US",
    siteName: "SKMEI.LB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${notoSans.variable}`}>
      <body className="antialiased bg-white text-brand-black font-montserrat" suppressHydrationWarning>
        <StoreLayout>{children}</StoreLayout>
      </body>
    </html>
  );
}
