import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skmeilb.com";

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${BASE_URL}/api/products/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = product.name;
  const categoryLabel = product.category
    ? product.category.charAt(0).toUpperCase() + product.category.slice(1)
    : "Watch";
  const description = product.description
    ? `${product.description.slice(0, 140)}. Buy in Lebanon with free delivery & 1-year warranty.`
    : `Buy ${product.name} in Lebanon. Authentic SKMEI ${categoryLabel} watch. Free nationwide delivery. 1-year warranty. Best price guaranteed.`;
  const image = product.images?.[0];

  return {
    title: `${title} – Buy in Lebanon | Free Delivery`,
    description,
    keywords: [
      product.name,
      `${product.name} Lebanon`,
      `buy ${product.name}`,
      `SKMEI ${categoryLabel} watch Lebanon`,
      `SKMEI ${product.sku}`,
      "SKMEI Lebanon",
      "buy watch Lebanon",
      "authentic SKMEI Lebanon",
      product.sku,
    ].filter(Boolean),
    openGraph: {
      title: `${title} | Buy in Lebanon – SKMEI.LB`,
      description,
      type: "website",
      url: `https://skmei.lb/store/products/${product.slug}`,
      siteName: "SKMEI.LB",
      images: image
        ? [
            {
              url: image,
              width: 800,
              height: 800,
              alt: `${title} – SKMEI Lebanon`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | SKMEI.LB Lebanon`,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: `https://skmei.lb/store/products/${product.slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  const BASE = "https://skmei.lb";
  const categoryLabel = product
    ? product.category.charAt(0).toUpperCase() + product.category.slice(1)
    : "";

  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${BASE}/store/products/${product.slug}#product`,
        name: product.name,
        description: product.description,
        image: product.images ?? [],
        sku: product.sku,
        mpn: product.sku,
        brand: {
          "@type": "Brand",
          name: product.brand ?? "SKMEI",
          url: "https://www.skmei.com",
        },
        category: `Watches > ${categoryLabel}`,
        offers: {
          "@type": "Offer",
          url: `${BASE}/store/products/${product.slug}`,
          priceCurrency: "USD",
          price: product.price,
          priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: "SKMEI.LB",
            url: BASE,
          },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: product.price >= 50 ? "0" : "4",
              currency: "USD",
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: {
                "@type": "QuantitativeValue",
                minValue: 0,
                maxValue: 1,
                unitCode: "DAY",
              },
              transitTime: {
                "@type": "QuantitativeValue",
                minValue: 3,
                maxValue: 5,
                unitCode: "DAY",
              },
            },
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "LB",
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "LB",
            returnPolicyCategory:
              "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 7,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/FreeReturn",
          },
        },
        ...(product.rating && product.reviewCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.rating,
                reviewCount: product.reviewCount,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }
    : null;

  const breadcrumbSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE },
          {
            "@type": "ListItem",
            position: 2,
            name: "Watches",
            item: `${BASE}/store/products`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${categoryLabel} Watches`,
            item: `${BASE}/store/products?category=${product.category}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: product.name,
            item: `${BASE}/store/products/${product.slug}`,
          },
        ],
      }
    : null;

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <ProductDetailClient slug={slug} />
    </>
  );
}
