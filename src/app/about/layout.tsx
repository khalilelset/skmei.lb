import type { Metadata } from "next";

const SITE_URL = "https://skmei.lb";

export const metadata: Metadata = {
  title: "About SKMEI.LB – Official Authorized SKMEI Dealer in Lebanon",
  description:
    "SKMEI.LB is Lebanon's official authorized SKMEI watch dealer. 100% authentic products, 1-year warranty, free nationwide delivery. Learn about our story, mission, and commitment to quality timepieces.",
  keywords: [
    "about SKMEI Lebanon",
    "SKMEI official dealer Lebanon",
    "SKMEI authorized dealer Lebanon",
    "watch dealer Lebanon",
    "authentic watches Lebanon",
    "SKMEI Lebanon story",
    "Lebanese watch store",
    "watch warranty Lebanon",
    "عن SKMEI لبنان",
    "وكيل رسمي ساعات لبنان",
  ],
  openGraph: {
    title: "About SKMEI.LB – Lebanon's Official SKMEI Watch Dealer",
    description:
      "Learn about SKMEI.LB — Lebanon's official authorized dealer of authentic SKMEI watches. 500+ happy customers, free delivery, 1-year warranty.",
    type: "website",
    url: `${SITE_URL}/about`,
    siteName: "SKMEI.LB",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630, alt: "About SKMEI.LB" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About SKMEI.LB – Lebanon's Official SKMEI Watch Dealer",
    description: "Official authorized SKMEI dealer in Lebanon. 100% authentic, 1-year warranty, free delivery.",
    images: ["/images/og-image.jpg"],
  },
  alternates: { canonical: `${SITE_URL}/about` },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${SITE_URL}/about#aboutpage`,
  url: `${SITE_URL}/about`,
  name: "About SKMEI.LB",
  description:
    "SKMEI.LB is Lebanon's official authorized SKMEI watch dealer offering 100% authentic digital, sports, smart, analog and luxury SKMEI watches with free nationwide delivery and 1-year warranty.",
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#organization` },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/about` },
    ],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      {children}
    </>
  );
}
