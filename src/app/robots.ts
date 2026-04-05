import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow all public pages, block private areas
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/account/",
          "/store/checkout/",
          "/store/cart/",
          "/store/orders/",
        ],
      },
      // Allow AI crawlers for Generative Engine Optimization (GEO)
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "cohere-ai", "meta-externalagent", "Applebot-Extended"],
        allow: ["/", "/about", "/contact", "/store/products"],
        disallow: ["/admin/", "/api/", "/account/"],
      },
    ],
    sitemap: "https://skmei.lb/sitemap.xml",
    host: "https://skmei.lb",
  };
}
