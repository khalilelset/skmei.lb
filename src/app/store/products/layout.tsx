import type { Metadata } from "next";

const SITE_URL = "https://skmei.lb";

export const metadata: Metadata = {
  title: "Buy SKMEI Watches in Lebanon – Full Collection | Official Store",
  description:
    "Shop the largest collection of authentic SKMEI watches in Lebanon. Digital, Analog, Sports, Smart & Luxury watches from $15. Free nationwide delivery. 1-year warranty. Official authorized dealer.",
  keywords: [
    "buy SKMEI watches Lebanon",
    "SKMEI watch collection Lebanon",
    "SKMEI watches online Lebanon",
    "digital watches Lebanon",
    "sports watches Lebanon",
    "smart watches Lebanon",
    "analog watches Lebanon",
    "luxury watches Lebanon",
    "affordable watches Lebanon",
    "SKMEI shop Lebanon",
    "شراء ساعات SKMEI لبنان",
    "ساعات رياضية رخيصة لبنان",
    "متجر ساعات اونلاين لبنان",
  ],
  openGraph: {
    title: "Buy SKMEI Watches in Lebanon – 100+ Models | SKMEI.LB",
    description:
      "Shop 100+ authentic SKMEI watches in Lebanon. Digital, Analog, Sports, Smart & Luxury from $15. Free delivery. 1-year warranty.",
    type: "website",
    url: `${SITE_URL}/store/products`,
    siteName: "SKMEI.LB",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630, alt: "SKMEI Watches Lebanon Collection" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy SKMEI Watches in Lebanon – Official Store",
    description: "100+ authentic SKMEI watches. Free delivery. 1-year warranty. Best prices in Lebanon.",
    images: ["/images/og-image.jpg"],
  },
  alternates: {
    canonical: `${SITE_URL}/store/products`,
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
