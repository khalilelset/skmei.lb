import type { Metadata } from "next";

const SITE_URL = "https://skmei.lb";

export const metadata: Metadata = {
  title: "Contact SKMEI.LB – WhatsApp, Email & Customer Support Lebanon",
  description:
    "Contact SKMEI.LB 24/7 via WhatsApp (+961 79 170 387) or email (skmei.lb@gmail.com). Get help with orders, product questions, shipping, warranty and more. Lebanon's official SKMEI watch dealer.",
  keywords: [
    "contact SKMEI Lebanon",
    "SKMEI Lebanon phone number",
    "SKMEI Lebanon WhatsApp",
    "watch store contact Lebanon",
    "SKMEI customer service Lebanon",
    "buy watch Lebanon contact",
    "تواصل SKMEI لبنان",
    "خدمة عملاء ساعات لبنان",
  ],
  openGraph: {
    title: "Contact SKMEI.LB – Get in Touch 24/7 | WhatsApp & Email",
    description:
      "Reach SKMEI.LB anytime via WhatsApp +961 79 170 387 or skmei.lb@gmail.com. We're here to help with orders, products, and shipping across Lebanon.",
    type: "website",
    url: `${SITE_URL}/contact`,
    siteName: "SKMEI.LB",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630, alt: "Contact SKMEI.LB" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact SKMEI.LB – WhatsApp & Email Support Lebanon",
    description: "Contact Lebanon's official SKMEI watch dealer 24/7 via WhatsApp or email.",
    images: ["/images/og-image.jpg"],
  },
  alternates: { canonical: `${SITE_URL}/contact` },
};

const contactSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${SITE_URL}/contact#contactpage`,
      url: `${SITE_URL}/contact`,
      name: "Contact SKMEI.LB",
      description: "Contact SKMEI.LB — Lebanon's official SKMEI watch dealer — via WhatsApp or email.",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Contact", item: `${SITE_URL}/contact` },
        ],
      },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#localbusiness`,
      name: "SKMEI.LB",
      telephone: "+96179170387",
      email: "skmei.lb@gmail.com",
      url: SITE_URL,
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+96179170387",
          contactType: "customer service",
          contactOption: "TollFree",
          availableLanguage: ["English", "Arabic"],
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
            opens: "00:00",
            closes: "23:59",
          },
        },
        {
          "@type": "ContactPoint",
          email: "skmei.lb@gmail.com",
          contactType: "customer support",
          availableLanguage: ["English", "Arabic"],
        },
      ],
    },
  ],
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      {children}
    </>
  );
}
