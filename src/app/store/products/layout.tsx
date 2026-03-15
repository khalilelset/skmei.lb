import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Watches",
  description:
    "Browse our full collection of authentic SKMEI watches in Lebanon. Filter by category: Digital, Analog, Sports, Smart, and Luxury timepieces. Free delivery nationwide.",
  keywords: [
    "SKMEI watch collection Lebanon",
    "buy SKMEI watch",
    "digital watches",
    "sports watches",
    "smart watches",
    "analog watches",
    "luxury watches Lebanon",
  ],
  openGraph: {
    title: "All SKMEI Watches – Browse Our Full Collection | SKMEI.LB",
    description:
      "Browse authentic SKMEI watches in Lebanon. Digital, Analog, Sports, Smart & Luxury. Free delivery. 1-year warranty.",
    type: "website",
    url: "https://skmei.lb/store/products",
  },
  alternates: {
    canonical: "https://skmei.lb/store/products",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
