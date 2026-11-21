# AI usage

## Tools and plan

- I used Codex to break down the brief, draft an implementation plan, build the API and UI, and review and test the result. The Codex session showed GPT-6.2 Sol Light during the project. I used OpenAI image generation for the five sample product photos.
- I used `AGENTS.md` for coding instructions and `DECISIONS.md` to record product assumptions. The first milestone was to load a product through the API, submit an enquiry, and see the email in a local inbox.

## Prompts that shaped the work

1. I asked for the acceptance criteria and the decisions I needed to make before coding. We settled on React and Express with TypeScript, using Fake Store for live products and the sales inbox for enquiries. That kept a database out of scope.
2. I asked for an API plan before approving implementation. I specified Express conventions, brief comments, focused tests for edge cases, and small commits I could review.
3. I asked for a clean-checkout demo. Fake Store returned HTTP 403 from the test workspace, so we added an opt-in sample catalogue with local images and verified the browser-to-inbox flow with Mailpit.
4. I asked for matching products as I typed and for selecting a suggestion to run the search automatically. Codex reused the existing search endpoint. We verified touch and keyboard selection in Chromium.

## Mistakes I caught and how we corrected them

| What I noticed | What changed |
|---|---|
| The README used `&&` and Bash-style environment variable syntax in the general setup instructions. I hit a parser error in Windows PowerShell 5.1. | We split the install commands and documented separate API startup commands for PowerShell and Bash/Zsh. When Docker Desktop blocked my local test because it needed a WSL update, I asked for a Docker-free path. The README now includes native Mailpit instructions for Windows. |
| The homepage banner took up most of my screen and pushed the products below the fold. | I shared a screenshot and asked for a more compact layout. Codex removed the banner and put the featured grid immediately below the navigation. Chromium showed all five featured cards without scrolling at the desktop viewport we tested. |
| I found “Home” ambiguous as a category. Codex renamed it in sample data before I confirmed how category tabs were populated. | I checked whether the tabs were dynamic and asked to discard the rename. We kept category labels driven by the active product source. |
| Codex's review found that hiding the enquiry form could discard the draft or interrupt the browser's handling of a pending submission. | I approved the fix. The form now stays mounted when collapsed. A regression test verifies that the input survives, only one request is sent, and confirmation appears after success. |
