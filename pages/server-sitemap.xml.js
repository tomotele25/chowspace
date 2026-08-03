import { getServerSideSitemapLegacy } from "next-sitemap";
import { BACKENDURL } from "@/lib/api";

export async function getServerSideProps(ctx) {
  try {
    const res = await fetch(
      `${BACKENDURL}/api/vendor/getVendors`
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch vendors, status: ${res.status}`);
    }
    const data = await res.json();
    const vendors = data.vendors || [];

    const fields = vendors.map((vendor) => ({
      loc: `https://chowspace.ng/vendors/menu/${vendor.slug}`,
      lastmod: vendor.updatedAt || new Date().toISOString(),
      changefreq: "daily",
      priority: 0.9,
    }));

    return getServerSideSitemapLegacy(ctx, fields);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return {
      notFound: true,
    };
  }
}

export default function Sitemap() {
  return null;
}
