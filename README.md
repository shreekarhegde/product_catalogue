# Product catalogue

Browse featured products and categories, search the catalogue, and send a product enquiry. The React app uses the Express API for catalogue data and enquiries.

## Local development

Use Node 24.15 or later in the Node 24 line and Docker for the local email inbox. From the repository root, install dependencies and start Mailpit:

```sh
npm --prefix api ci && npm --prefix web ci
docker run --rm -d --name catalogue-mailpit -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 axllent/mailpit
```

Run the following in separate terminals:

```sh
USE_SAMPLE_CATALOGUE=true npm --prefix api run dev
npm --prefix web run dev
```

Open the URL printed by Vite. Submit an enquiry from a product page, then check the message in Mailpit at `http://localhost:8025`. The API defaults are in `api/.env.example`. Copy it to `api/.env` if you need to override them. The Vite proxy uses port 3001 by default. Set `CATALOGUE_API_URL` when starting Vite if your API is listening elsewhere.

The command above loads the bundled sample catalogue so the walkthrough works without an external product provider. Search for “Travel Bag”, open the item, and submit an enquiry. For live data, start the API with `npm --prefix api run dev`. It uses Fake Store API by default.

Stop the local inbox with `docker stop catalogue-mailpit`.

## Checks

```sh
npm --prefix api test
npm --prefix web test
npm --prefix web run build
```
