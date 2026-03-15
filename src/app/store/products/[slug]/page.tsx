import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skmei.lb";

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
  params: { slug: string };
}): Promise<Metadata> {
  const product = await fetchProduct(params.slug);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = product.name;
  const description =
    product.description ||
    `Buy ${product.name} in Lebanon. Authentic SKMEI ${product.category} watch. Free delivery. 1-year warranty.`;
  const image = product.images?.[0];

  return {
    title,
    description,
    keywords: [
      product.name,
      `SKMEI ${product.category} watch`,
      "SKMEI Lebanon",
      "buy watch Lebanon",
      product.sku,
    ].filter(Boolean),
    openGraph: {
      title: `${title} | SKMEI.LB`,
      description,
      type: "website",
      url: `https://skmei.lb/store/products/${product.slug}`,
      images: image
        ? [{ url: image, width: 800, height: 800, alt: title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | SKMEI.LB`,
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
  params: { slug: string };
}) {
  const product = await fetchProduct(params.slug);

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images ?? [],
        sku: product.sku,
        brand: {
          "@type": "Brand",
          name: product.brand ?? "SKMEI",
        },
        offers: {
          "@type": "Offer",
          url: `https://skmei.lb/store/products/${product.slug}`,
          priceCurrency: "USD",
          price: product.price,
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: "SKMEI.LB",
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

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient slug={params.slug} />
    </>
  );
}
