# AI usage

## Tools and models

- ChatGPT (Codex) helped summarize the brief, brainstorm implementation choices, and research comparable take-home exercises. Record the exact model if it is available in the session metadata.

## Planning and instructions

- The planning discussion identified a first milestone that goes from backend product data through the detail page and enquiry form to a local sales inbox.
- Repository instructions are in `AGENTS.md`. Record final product decisions in `DECISIONS.md` or the README.

## Key prompts and decisions

1. Asked for a breakdown of the assignment and scoring criteria, then for the decisions needed before coding. This surfaced homepage curation, category ranking, search matching, and the enquiry success condition as decisions to review.

Add actual prompts or moments as work progresses, aiming for 3–5 in total.

## Review and corrections

Record concrete AI mistakes as they occur, how they were detected, what changed, and how the correction was verified.

## Backend implementation

- Asked Codex to use Express conventions, keep comments brief, and cover corner cases with focused tests. The resulting checks exercise route validation, upstream failures, rate limits, and SMTP outcomes using controlled dependencies.
- A smoke test assumed live Fake Store API access. It returned HTTP 403 from this workspace. I verified that the API exposed a safe 502, then tested SMTP delivery independently with a product fixture and inspected the Mailpit message.

## Frontend implementation

- Asked Codex to build the catalogue UI and connect it to the existing API. The implementation reused the API's error messages for retry feedback and tested that failed enquiries preserve form input.
- The first browser smoke test hit a development API already listening on port 3001. I made the Vite proxy target configurable and verified the complete flow on isolated ports with a controlled catalogue and real Mailpit.
