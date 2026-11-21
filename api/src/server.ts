import { createApp } from "./app.js";
import { smtpMailer } from "./enquiries.js";
import { fakeStore } from "./products.js";
import { loadSampleProducts } from "./sample-products.js";

const port = Number(process.env.PORT ?? "3001");
const app = createApp(
  process.env.USE_SAMPLE_CATALOGUE === "true"
    ? loadSampleProducts
    : fakeStore(process.env.PRODUCT_API_BASE_URL ?? "https://fakestoreapi.com"),
  smtpMailer({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? "1025"),
    from: process.env.SMTP_FROM ?? "catalogue@example.test",
    to: process.env.SALES_EMAIL ?? "sales@example.test",
  }),
);

app.listen(port, "127.0.0.1", (error) => {
  if (error) {
    console.error(`Could not start the catalogue API: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Catalogue API listening on http://127.0.0.1:${port}`);
});
