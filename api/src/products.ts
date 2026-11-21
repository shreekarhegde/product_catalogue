import { z } from "zod";
import { ApiError } from "./errors.js";

const productSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  image: z.url({ protocol: /^https?$/ }),
  rating: z.object({ rate: z.number().min(0).max(5), count: z.number().int().nonnegative() }),
});

export type Product = z.infer<typeof productSchema>;
export type LoadProducts = () => Promise<Product[]>;

export const featuredIds = [1, 5, 9, 15, 20];

export function fakeStore(baseUrl: string, timeoutMs = 5000): LoadProducts {
  const endpoint = new URL("products", baseUrl.replace(/\/*$/, "/"));
  return async () => {
    const signal = AbortSignal.timeout(timeoutMs);
    try {
      const response = await fetch(endpoint, { signal, redirect: "error" });
      if (!response.ok) throw new Error("Upstream request failed");
      const products = z.array(productSchema).parse(await response.json());
      if (new Set(products.map(({ id }) => id)).size !== products.length) {
        throw new Error("Duplicate product IDs");
      }
      return products;
    } catch {
      if (signal.aborted) {
        throw new ApiError(504, "catalogue_timeout", "The product catalogue took too long to respond.");
      }
      throw new ApiError(502, "catalogue_unavailable", "The product catalogue is temporarily unavailable.");
    }
  };
}

export function productId(value: string): number {
  const id = Number(value);
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(id)) {
    throw new ApiError(400, "invalid_product_id", "Use a positive integer product ID.");
  }
  return id;
}

export function findProduct(products: Product[], id: number): Product {
  const product = products.find((item) => item.id === id);
  if (!product) throw new ApiError(404, "product_not_found", "Product not found.");
  return product;
}

export function searchQuery(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value !== "string" || value.length > 100) {
    throw new ApiError(400, "invalid_search", "Provide one search term of at most 100 characters.");
  }
  return value.trim().toLowerCase();
}

export function searchProducts(products: Product[], query: string): Product[] {
  return products.filter(({ title, description }) =>
    title.toLowerCase().includes(query) || description.toLowerCase().includes(query),
  );
}

export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function splitCategory(products: Product[]) {
  const ranked = [...products].sort((a, b) => b.rating.rate - a.rating.rate || a.id - b.id);
  // Keep a product in the remaining section whenever the category has room.
  const count = Math.min(3, Math.max(1, ranked.length - 1));
  return { featured: ranked.slice(0, count), remaining: ranked.slice(count) };
}
