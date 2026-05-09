import { MetadataRoute } from "next";
import { supabaseServer } from "@/lib/supabase/server";

const BASE_URL = "https://skmei.lb";

const CATEGORY_SLUGS = ["digital", "analog", "sports", "smart", "luxury"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabaseServer
    .from("products")
    .select("slug, updated_at")
    .order("created_at", { ascending: false });

  const productPages: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE_URL}/store/products/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at as string) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/store/products?category=${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/store/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    ...categoryPages,
    ...productPages,
  ];
}
