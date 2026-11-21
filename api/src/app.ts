import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { ApiError, handleError } from "./errors.js";
import {
  categorySlug, featuredIds, findProduct, productId, searchProducts, searchQuery, splitCategory,
  type LoadProducts,
} from "./products.js";
import { enquiryRouter, type SendEnquiry } from "./enquiries.js";

export function createApp(loadProducts: LoadProducts, sendEnquiry: SendEnquiry) {
  const app = express();
  app.disable("x-powered-by");
  // Local clients connect directly. Set an explicit proxy policy before deploying behind one.
  app.set("trust proxy", false);
  app.use(helmet());
  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/products/:id/enquiries", enquiryRouter(loadProducts, sendEnquiry));

  const catalogue = express.Router();
  catalogue.use(rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_request, _response, next) => {
      next(new ApiError(429, "rate_limited", "Too many catalogue requests. Try again shortly."));
    },
  }));

  catalogue.get("/products/featured", async (_request, response) => {
    const products = await loadProducts();
    const featured = featuredIds.map((id) => products.find((product) => product.id === id));
    if (featured.some((product) => !product)) {
      throw new ApiError(502, "featured_unavailable", "A featured product is temporarily unavailable.");
    }
    response.json(featured);
  });

  catalogue.get("/products", async (request, response) => {
    const query = searchQuery(request.query.q);
    response.json(searchProducts(await loadProducts(), query));
  });

  catalogue.get("/products/:id", async (request, response) => {
    const id = productId(request.params.id);
    response.json(findProduct(await loadProducts(), id));
  });

  catalogue.get("/categories", async (_request, response) => {
    const names = [...new Set((await loadProducts()).map(({ category }) => category))].sort();
    response.json(names.map((name) => ({ name, slug: categorySlug(name) })));
  });

  catalogue.get("/categories/:category/products", async (request, response) => {
    const products = (await loadProducts()).filter(
      ({ category }) => categorySlug(category) === request.params.category,
    );
    if (!products.length) throw new ApiError(404, "category_not_found", "Category not found.");
    response.json(splitCategory(products));
  });

  app.use("/api", catalogue);
  app.use((_request, _response, next) => {
    next(new ApiError(404, "route_not_found", "Route not found."));
  });
  app.use(handleError);
  return app;
}
