import express from "express";
import { rateLimit } from "express-rate-limit";
import nodemailer from "nodemailer";
import { z } from "zod";
import { ApiError } from "./errors.js";
import { findProduct, productId, type LoadProducts, type Product } from "./products.js";

export const enquirySchema = z.strictObject({
  name: z.string().trim().min(1).max(100).regex(/^[^\r\n]+$/),
  email: z.string().trim().max(254).pipe(z.email()),
  message: z.string().max(2000).trim().optional(),
});

type Enquiry = z.infer<typeof enquirySchema>;
export type SendEnquiry = (product: Product, enquiry: Enquiry) => Promise<void>;

export function enquiryRouter(loadProducts: LoadProducts, sendEnquiry: SendEnquiry) {
  const router = express.Router({ mergeParams: true });
  const limit = rateLimit({
    windowMs: 10 * 60_000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_request, _response, next) => {
      next(new ApiError(429, "rate_limited", "Too many enquiries. Try again later."));
    },
  });

  router.post<{ id: string }>("/", limit, (request, _response, next) => {
    if (!request.is("application/json")) {
      throw new ApiError(415, "unsupported_media_type", "Send the enquiry as application/json.");
    }
    next();
  }, express.json({ limit: "16kb" }), async (request, response) => {
    const id = productId(request.params.id);
    const parsed = enquirySchema.safeParse(request.body);
    if (!parsed.success) {
      const fields = [...new Set(parsed.error.issues.map(({ path }) => path[0]).filter(Boolean))];
      throw new ApiError(400, "invalid_enquiry", fields.length
        ? `Check these enquiry fields: ${fields.join(", ")}.`
        : "Provide a name and valid email with an optional message.");
    }

    const product = findProduct(await loadProducts(), id);
    try {
      await sendEnquiry(product, parsed.data);
    } catch {
      throw new ApiError(503, "email_unavailable", "We could not send your enquiry. Please try again.");
    }
    response.json({ message: "Thank you" });
  });
  return router;
}

export function smtpMailer(settings: { host: string; port: number; from: string; to: string }): SendEnquiry {
  const transport = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });

  return async (product, enquiry) => {
    const result = await transport.sendMail({
      from: settings.from,
      to: settings.to,
      replyTo: enquiry.email,
      subject: `Catalogue enquiry for product #${product.id}`,
      text: [
        `Product: ${product.title} (#${product.id})`,
        `Name: ${enquiry.name}`,
        `Email: ${enquiry.email}`,
        "",
        enquiry.message ?? "",
      ].join("\n"),
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    if (!result.accepted.length) throw new Error("SMTP did not accept the enquiry");
  };
}
