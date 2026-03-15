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

const SITE_URL = "https://skmei.lb";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SKMEI.LB – Official SKMEI Watch Store in Lebanon",
    template: "%s | SKMEI.LB",
  },
  description:
    "Shop 100% authentic SKMEI watches in Lebanon. Digital, Analog, Sports, Smart & Luxury timepieces. Free nationwide delivery. Official dealer with 1-year warranty.",
  keywords: [
    "SKMEI watches Lebanon",
    "SKMEI Lebanon",
    "ساعات SKMEI لبنان",
    "buy watch Lebanon",
    "digital watches Lebanon",
    "sports watches Lebanon",
    "smart watches Lebanon",
    "luxury watches Lebanon",
    "authentic SKMEI dealer",
    "SKMEI official store",
  ],
  authors: [{ name: "SKMEI.LB", url: SITE_URL }],
  creator: "SKMEI.LB",
  publisher: "SKMEI.LB",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "SKMEI.LB – Official SKMEI Watch Store in Lebanon",
    description:
      "Shop 100% authentic SKMEI watches in Lebanon. Free delivery. 1-year warranty. Official dealer.",
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "SKMEI.LB",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SKMEI.LB – Official SKMEI Watch Store in Lebanon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SKMEI.LB – Official SKMEI Watch Store in Lebanon",
    description:
      "Shop 100% authentic SKMEI watches in Lebanon. Free delivery. 1-year warranty.",
    images: ["/images/og-image.jpg"],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "SKMEI.LB",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/logo/black.png`,
        width: 200,
        height: 60,
      },
      description:
        "Official SKMEI watch dealer in Lebanon. Authentic digital, analog, sports, smart and luxury watches.",
      areaServed: { "@type": "Country", name: "Lebanon" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "SKMEI.LB",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/store/products?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#localbusiness`,
      name: "SKMEI.LB",
      url: SITE_URL,
      description:
        "Official SKMEI watch dealer in Lebanon. Authentic digital, analog, sports, smart and luxury timepieces with free delivery and 1-year warranty.",
      areaServed: { "@type": "Country", name: "Lebanon" },
      currenciesAccepted: "LBP, USD",
      paymentAccepted: "Cash on delivery",
      priceRange: "$$",
      image: `${SITE_URL}/images/og-image.jpg`,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${notoSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-white text-brand-black font-montserrat" suppressHydrationWarning>
        <StoreLayout>{children}</StoreLayout>
      </body>
    </html>
  );
}
