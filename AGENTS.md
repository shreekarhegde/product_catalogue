# Working on the catalogue

- Read `DECISIONS.md` before changing customer-facing behavior. Record any new assumptions or cuts there.
- Keep work on the feature branch. Prioritize the five acceptance flows and keep the pull request open for review.
- Fetch product data through the backend. Keep provider-specific product and email code on the server.
- Validate enquiries on the server. Show success after the mail transport accepts the message and keep form input on failure.
- Keep reviewer setup quick and account-free. Commit example configuration with local defaults and keep real credentials out of Git.
- Use deterministic fixtures for tests. Cover featured products, category grouping, search, and enquiry success and failure. Verify the real local SMTP flow manually.
- Review generated changes and record actual prompts, corrections, and verification in `AI_USAGE.md`. Track time spent across planning, building, testing, and review.
