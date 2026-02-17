import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/templates", "/login", "/terms", "/privacy"],
      disallow: [
        "/api/",
        "/admin",
        "/builder/",
        "/checkout/",
        "/cover-letter/",
        "/dashboard/",
        "/profile/",
        "/resume/",
        "/settings/",
        "/tracker/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
