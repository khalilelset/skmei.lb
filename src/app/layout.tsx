import type { Metadata } from "next";
import { Montserrat, Noto_Sans, Cinzel, Pacifico } from "next/font/google";
import "./globals.css";
import StoreLayout from "@/components/StoreLayout";
import { Analytics } from "@vercel/analytics/next";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "800", "900"],
  variable: "--font-cinzel",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-pacifico",
});

const SITE_URL = "https://skmei.lb";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SKMEI.LB – Official SKMEI Watch Store in Lebanon",
    template: "%s | SKMEI.LB",
  },
  description:
    "Shop 100% authentic SKMEI watches in Lebanon. Digital, Analog, Sports, Smart & Luxury timepieces. Free nationwide delivery. Official authorized dealer with 1-year warranty. Best prices guaranteed.",
  keywords: [
    "SKMEI watches Lebanon",
    "SKMEI Lebanon",
    "ساعات SKMEI لبنان",
    "buy watch Lebanon",
    "watch store Lebanon",
    "online watch shop Lebanon",
    "digital watches Lebanon",
    "sports watches Lebanon",
    "smart watches Lebanon",
    "luxury watches Lebanon",
    "analog watches Lebanon",
    "authentic SKMEI dealer",
    "SKMEI official store",
    "SKMEI authorized dealer Lebanon",
    "best watches Lebanon",
    "cheap watches Lebanon",
    "affordable watches Lebanon",
    "ساعات رياضية لبنان",
    "ساعات رخيصة لبنان",
    "شراء ساعات لبنان",
    "متجر ساعات لبنان",
  ],
  authors: [{ name: "SKMEI.LB", url: SITE_URL }],
  creator: "SKMEI.LB",
  publisher: "SKMEI.LB",
  category: "E-commerce, Watches, Jewelry",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "SKMEI.LB – Official SKMEI Watch Store in Lebanon",
    description:
      "Shop 100% authentic SKMEI watches in Lebanon. Free delivery. 1-year warranty. Official authorized dealer. Best prices.",
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
      "Shop 100% authentic SKMEI watches in Lebanon. Free delivery. 1-year warranty. Best prices.",
    images: ["/images/og-image.jpg"],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-LB": SITE_URL,
      "ar-LB": SITE_URL,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "SKMEI.LB",
      alternateName: ["SKMEI Lebanon", "ساعات SKMEI لبنان"],
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        "@id": `${SITE_URL}/#logo`,
        url: `${SITE_URL}/images/logo/black.png`,
        contentUrl: `${SITE_URL}/images/logo/black.png`,
        width: 200,
        height: 60,
        caption: "SKMEI.LB Official Logo",
      },
      image: `${SITE_URL}/images/og-image.jpg`,
      description:
        "Official authorized SKMEI watch dealer in Lebanon. Authentic digital, analog, sports, smart and luxury SKMEI watches with free nationwide delivery and 1-year warranty.",
      email: "skmei.lb@gmail.com",
      telephone: "+96179170387",
      areaServed: { "@type": "Country", name: "Lebanon" },
      foundingDate: "2023",
      knowsLanguage: ["en", "ar"],
      sameAs: [
        "https://www.instagram.com/skmei.lb",
        "https://wa.me/96179170387",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+96179170387",
        contactType: "customer service",
        availableLanguage: ["English", "Arabic"],
        areaServed: "LB",
        contactOption: "TollFree",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "SKMEI.LB",
      description: "Official SKMEI Watch Store in Lebanon",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: ["en-LB", "ar-LB"],
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
      "@type": ["LocalBusiness", "Store", "OnlineStore"],
      "@id": `${SITE_URL}/#localbusiness`,
      name: "SKMEI.LB",
      alternateName: "SKMEI Lebanon",
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo/black.png`,
      image: `${SITE_URL}/images/og-image.jpg`,
      description:
        "Official authorized SKMEI watch dealer in Lebanon. Authentic digital, analog, sports, smart and luxury SKMEI timepieces with free delivery and 1-year warranty. Best prices guaranteed.",
      telephone: "+96179170387",
      email: "skmei.lb@gmail.com",
      areaServed: [
        { "@type": "Country", name: "Lebanon" },
        { "@type": "AdministrativeArea", name: "Beirut" },
        { "@type": "AdministrativeArea", name: "Mount Lebanon" },
        { "@type": "AdministrativeArea", name: "North Lebanon" },
        { "@type": "AdministrativeArea", name: "South Lebanon" },
        { "@type": "AdministrativeArea", name: "Bekaa" },
        { "@type": "AdministrativeArea", name: "Nabatieh" },
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "LB",
        addressRegion: "Lebanon",
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
      currenciesAccepted: "LBP, USD",
      paymentAccepted: "Cash on delivery, Bank transfer",
      priceRange: "$$",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "SKMEI Watches Lebanon",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Digital Watches Lebanon" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Sports Watches Lebanon" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Smart Watches Lebanon" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Analog Watches Lebanon" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Luxury Watches Lebanon" } },
        ],
      },
      sameAs: [
        "https://www.instagram.com/skmei.lb",
        "https://wa.me/96179170387",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-LB" className={`${montserrat.variable} ${notoSans.variable} ${cinzel.variable} ${pacifico.variable}`}>
      <head>
        {/* ── Resource hints: tell browser to connect to CDNs before images are requested ── */}
        {/* Unsplash — hero + category images */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {/* Cloudinary — product images uploaded via admin */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Supabase storage — product images stored in Supabase */}
        <link rel="dns-prefetch" href="https://supabase.co" />
        {/* Google Fonts static assets */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-brand-black font-montserrat" suppressHydrationWarning>
        <StoreLayout>{children}</StoreLayout>
        <Analytics />
      </body>
    </html>
  );
}
