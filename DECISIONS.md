# Decisions

## Stack and scope

- Use React and Express with TypeScript. The browser calls the Express API for catalogue data and enquiries.
- Use Fake Store API for live products. Skip the database because there’s no catalogue editing or enquiry history in this version. The sales inbox keeps the enquiries.
- Keep the product source and mail transport replaceable so a provider change can be made without rewriting the catalogue screens.

## Catalogue and search

- Show five featured products in a fixed order using a list of product IDs in the backend. Updating the picks requires a code change for now.
- Put the featured grid directly below the navigation. The first layout used a large banner that pushed products below the fold, so we replaced it with a compact heading and kept the Browse all products link.
- Build category tabs from the active catalogue and display the provider’s category names. Sample and live modes can show different tabs.
- Feature up to three products per category, highest rating first, with ties broken by product ID. When there are at least two products, leave at least one in the remaining section. Show each product once.
- Search titles and descriptions using a trimmed, case-insensitive substring. A blank search shows all products. While the customer types, suggest up to six matching product titles. Selecting one runs the search immediately. The submitted query stays in the URL.
- Display demo prices in USD because Fake Store has no currency field. Live products use the provider’s image URLs. Sample products have five bundled WebP images so the demo can display them without an external image service.

## Enquiries and API behavior

- Require a name and email, with an optional message. Validate the input and product on the server. Send to the configured sales inbox and use the customer’s email as Reply-To.
- Show “Thank you” after SMTP accepts the message. Keep the draft if sending fails. Collapsing the form preserves both the draft and any in-progress submission.
- Validate data from Fake Store and give requests a five-second timeout. Return consistent API errors so the UI can show an appropriate retry message.
- Limit catalogue requests to 120 per minute per IP and enquiry submissions to five per ten minutes per IP. The limits use in-memory storage for the single-instance demo.

## Local review

- Keep Fake Store as the default. Offer an explicit sample mode because Fake Store returned HTTP 403 from the test workspace. The same browsing, search, and enquiry flows work with sample data.
- Use Mailpit to verify email locally without an account. Reviewers can run it directly on Windows or use Docker. The README covers both options.

## With another day

- Automate the browser-to-inbox smoke test and review the featured selection with the owner. Revisit persistent storage when catalogue editing, enquiry history, or delivery retries are needed.

## Time spent

- Approximately 2–3 hours of active work across planning, implementation, testing, and review, excluding time away. This is an estimate for the total.
