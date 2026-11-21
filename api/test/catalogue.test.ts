import { createServer } from "node:http";
import { once } from "node:events";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { enquirySchema } from "../src/enquiries.js";
import { fakeStore, featuredIds, productId, searchProducts, searchQuery, splitCategory, type Product } from "../src/products.js";

const products: Product[] = [...featuredIds].reverse().map((id) => ({
  id,
  title: id === 1 ? "Travel Bag" : "Other product",
  description: id === 5 ? "Fits a travel bag" : "",
  price: 10,
  category: id === 20 ? "electronics" : "men's clothing",
  image: "https://example.test/image.jpg",
  rating: { rate: id === 1 ? 1 : 4, count: 10 },
}));
const valid = { name: "Jamie", email: "jamie@example.test" };

function setup() {
  const load = vi.fn(async () => products);
  const send = vi.fn(async () => {});
  return { http: request(createApp(load, send)), load, send };
}

describe("catalogue rules", () => {
  it("rejects malformed and out-of-range IDs", () => {
    for (const value of ["", "0", "-1", "01", "1e2", "1.5", " 1", "9007199254740992"]) {
      expect(() => productId(value)).toThrow();
    }
    expect(productId("9007199254740991")).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("matches titles and descriptions, allowing a blank query", () => {
    expect(searchProducts(products, searchQuery("  TrAvEl ")).map(({ id }) => id)).toEqual([5, 1]);
    expect(searchProducts(products, searchQuery(" "))).toEqual(products);
    expect(() => searchQuery(["bag", "shirt"])).toThrow();
    expect(() => searchQuery("x".repeat(101))).toThrow();
    expect(searchQuery("x".repeat(100))).toHaveLength(100);
  });

  it("ranks ties by ID without mutating input and handles small categories", () => {
    expect(splitCategory(products).featured.map(({ id }) => id)).toEqual([5, 9, 15]);
    expect(products[0].id).toBe(20);
    expect(splitCategory(products.slice(0, 2)).remaining).toHaveLength(1);
    expect(splitCategory(products.slice(0, 1))).toEqual({ featured: [products[0]], remaining: [] });
    expect(splitCategory([])).toEqual({ featured: [], remaining: [] });
  });

  it("validates enquiry field boundaries", () => {
    expect(enquirySchema.parse({ ...valid, name: " Jamie ", message: " hi " }))
      .toEqual({ ...valid, message: "hi" });
    expect(enquirySchema.safeParse({ ...valid, name: "a".repeat(100), message: "b".repeat(2000) }).success).toBe(true);
    for (const invalid of [
      { name: " " }, { name: "a".repeat(101) }, { name: "A\nB" }, { email: "invalid" },
      { message: "b".repeat(2001) }, { message: null }, { to: "other@example.test" },
    ]) {
      expect(enquirySchema.safeParse({ ...valid, ...invalid }).success).toBe(false);
    }
  });
});

describe("catalogue HTTP", () => {
  it("serves homepage ordering, categories, and one product", async () => {
    const { http } = setup();
    const featured = await http.get("/api/products/featured").expect(200);
    expect(featured.body.map(({ id }: Product) => id)).toEqual(featuredIds);
    await http.get("/api/categories").expect(200, [
      { name: "electronics", slug: "electronics" }, { name: "men's clothing", slug: "mens-clothing" },
    ]);
    const category = await http.get("/api/categories/mens-clothing/products").expect(200);
    expect(category.body.featured.map(({ id }: Product) => id)).toEqual([5, 9, 15]);
    expect(category.body.remaining).toEqual([products.find(({ id }) => id === 1)]);
    await http.get("/api/products/1").expect(200, products.find(({ id }) => id === 1));
  });

  it("distinguishes invalid input, missing resources, and empty search", async () => {
    const { http, load } = setup();
    await http.get("/api/products?q=a&q=b").expect(400);
    await http.get("/api/products/1e2").expect(400);
    await http.get("/api/products/%ZZ").expect(400);
    expect(load).not.toHaveBeenCalled();
    await http.get("/api/products/100").expect(404);
    await http.get("/api/categories/unknown/products").expect(404);
    await http.get("/api/products?q=unmatched").expect(200, []);
    load.mockResolvedValueOnce([]);
    await http.get("/api/products/featured").expect(502);
  });

  it("sets protective headers and limits catalogue reads", async () => {
    const { http, load } = setup();
    for (let index = 0; index < 120; index++) {
      await http.get("/api/products").expect("X-Content-Type-Options", "nosniff").expect(200);
    }
    await http.get("/api/products").expect("Retry-After", /\d+/).expect(429);
    expect(load).toHaveBeenCalledTimes(120);
    await http.get("/api/health").expect(200);
  });

  it("validates upstream products and maps failures to safe errors", async () => {
    const server = createServer((req, res) => {
      if (req.url === "/ok/products") {
        res.end(JSON.stringify(products));
        return;
      }
      if (req.url === "/duplicates/products") {
        res.end(JSON.stringify([products[0], products[0]]));
        return;
      }
      if (req.url === "/slow/products") return;
      if (req.url === "/error/products") res.statusCode = 500;
      res.end('{"unexpected":true}');
    }).listen(0, "127.0.0.1");
    try {
      await once(server, "listening");
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Missing test server port");
      const upstream = `http://127.0.0.1:${address.port}`;
      await request(createApp(fakeStore(`${upstream}/ok`), vi.fn()))
        .get("/api/products/featured").expect(200);
      for (const [path, status, code] of [
        ["duplicates", 502, "catalogue_unavailable"],
        ["invalid", 502, "catalogue_unavailable"],
        ["error", 502, "catalogue_unavailable"],
        ["slow", 504, "catalogue_timeout"],
      ] as const) {
        const http = request(createApp(fakeStore(`http://127.0.0.1:${address.port}/${path}`, 100), vi.fn()));
        const result = await http.get("/api/products").expect(status);
        expect(result.body.error.code).toBe(code);
      }
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

describe("enquiry HTTP", () => {
  const path = "/api/products/1/enquiries";

  it("rejects invalid requests before sending", async () => {
    const { http, send } = setup();
    await http.post(path).type("text").send("hello").expect(415);
    await http.post(path).type("json").send("{").expect(400);
    await http.post(path).send({ ...valid, message: "a".repeat(17_000) }).expect(413);
    await http.post("/api/products/0/enquiries").send(valid).expect(400);
    await http.post("/api/products/100/enquiries").send(valid).expect(404);
    expect(send).not.toHaveBeenCalled();
  });

  it("confirms accepted mail and hides mailer failures", async () => {
    const { http, send } = setup();
    await http.post(path).send(valid).expect(200, { message: "Thank you" });
    expect(send).toHaveBeenCalledWith(products.find(({ id }) => id === 1), valid);
    send.mockRejectedValueOnce(new Error(valid.email));
    const result = await http.post(path).send(valid).expect(503);
    expect(result.body.error.code).toBe("email_unavailable");
    expect(result.text).not.toContain(valid.email);
  });

  it("shares the enquiry limit across product IDs and blocks delivery", async () => {
    const { http, send } = setup();
    for (let index = 0; index < 5; index++) {
      await http.post(path).send(valid).expect(200);
    }
    await http.post("/api/products/5/enquiries").send(valid).expect("Retry-After", /\d+/).expect(429);
    expect(send).toHaveBeenCalledTimes(5);
  });
});
