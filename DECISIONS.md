# Decisions

## Stack

- Use React and Node.js with TypeScript so reviewers can run the full flow in a browser.
- Fetch catalogue data from Fake Store API through the backend. Send enquiry emails from the backend.

## Product behavior

- **Home.** Show five owner-selected products in the order specified in a config file. Changing the selection requires a code change for this demo. Put the featured grid directly below the navigation so products are visible on first load.
- **Categories.** Sort by highest rating first, breaking ties by product ID. Feature up to three items and leave at least one in the remaining section when the category has two or more products. Show each product once.
- **Search.** Search on submit. Trim the query and match it anywhere in the title or description, ignoring case. A blank query shows all products. Suggest up to six matching product titles while the customer types. Selecting one submits a search for that title.
- **Product details.** Give each product its own page with an Enquire button. Show demo prices in USD because the source has no currency field.
- **Enquiries.** Require a name and email, with an optional message. Validate the product and contact details on the server, then send the email to the configured sales inbox. Show “Thank you” once the mail transport accepts it. Keep the form filled if sending fails. Collapsing the form preserves the draft and any in-progress submission.

## Scope and next steps

- **Storage.** Skip the database. Fake Store API holds the products, a config file holds the featured IDs, and the inbox holds the enquiries.
- **Local review.** Use a local SMTP inbox so reviewers can verify an enquiry without creating an account. An explicit sample catalogue mode with bundled images lets reviewers exercise the same flows if Fake Store API is unavailable. Mailpit can run directly on Windows or in Docker.
- **API safeguards.** Validate requests and upstream data, limit catalogue reads and enquiry submissions separately, and return consistent errors. The in-memory limits suit the single-instance demo.
- **Room to grow.** Keep the product and mail integrations on the server so each provider can be replaced. Reuse product cards and styles so the visual design can evolve.
- **With another day.** Automate the browser-to-inbox check and walk through the featured selection with the owner. Revisit storage if they need catalogue editing, enquiry history, or delivery retries.

## Time spent

- Approximately **2–3 hours of active work**, excluding time away. This is an estimate across planning, implementation, testing, and review. Time was recorded as a total.
