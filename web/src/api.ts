export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  image: string;
  rating: { rate: number; count: number };
}

interface Category {
  name: string;
  slug: string;
}

export interface Enquiry {
  name: string;
  email: string;
  message?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    throw new Error("The catalogue server could not be reached. Please try again.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok || body === null) {
    const message = body?.error?.message;
    throw new Error(typeof message === "string" ? message : "The request failed. Please try again.");
  }
  return body as T;
}

export const api = {
  featured: (signal: AbortSignal) => request<Product[]>("/products/featured", { signal }),
  categories: (signal: AbortSignal) => request<Category[]>("/categories", { signal }),
  category: (slug: string, signal: AbortSignal) =>
    request<{ featured: Product[]; remaining: Product[] }>(
      `/categories/${encodeURIComponent(slug)}/products`, { signal },
    ),
  search: (query: string, signal: AbortSignal) =>
    request<Product[]>(`/products?${new URLSearchParams({ q: query })}`, { signal }),
  product: (id: string, signal: AbortSignal) =>
    request<Product>(`/products/${encodeURIComponent(id)}`, { signal }),
  enquire: (id: number, enquiry: Enquiry, signal: AbortSignal) =>
    request<{ message: string }>(`/products/${id}/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enquiry),
      signal,
    }),
};
