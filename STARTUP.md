# Startup checklist

## 1. Prepare the repository

For an empty remote, create a minimal README commit on `main` and push it. Then create `feature/catalogue-mvp` from that commit.

```sh
gh repo view shreekarhegde/product_catalogue --json visibility,defaultBranchRef
git clone https://github.com/shreekarhegde/product_catalogue.git
cd product_catalogue
git switch -c main
printf '# Product catalogue\n' > README.md
git add README.md
git commit -m "Initialize product catalogue"
git push -u origin main
git switch -c feature/catalogue-mvp
```

If `main` already exists, branch from it and skip initialization. Copy the reviewed docs to the feature branch.

## 2. Scaffold the frontend and backend

Check `node --version`, `npm --version`, and `docker compose version`. Record the Node version used and commit npm lockfiles. Use Vite for the React and TypeScript scaffold. Start with native form controls and plain CSS. Add React Router for catalogue routes.

```sh
npm create vite@latest web -- --template react-ts
npm --prefix web install react-router-dom
npm --prefix web install -D vitest @testing-library/react @testing-library/jest-dom jsdom
mkdir -p api
(cd api && npm init -y)
npm --prefix api install express zod nodemailer
npm --prefix api install -D typescript tsx vitest supertest @types/node @types/express @types/nodemailer @types/supertest
```

Express is the proposed HTTP library on Node.js. Use Node's built-in fetch for Fake Store API, Zod for enquiry validation, and Nodemailer with Mailpit for local SMTP. Use Vitest for both apps, Testing Library for targeted UI tests, and Supertest for HTTP tests. The database and ORM can be omitted.

## 3. Add example configuration

- Add `api/.env.example` with `PORT=3001`, `PRODUCT_API_BASE_URL=https://fakestoreapi.com`, `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_FROM=catalogue@example.test`, and `SALES_EMAIL=sales@example.test`.
- Ignore real `.env` files and keep `.env.example` tracked. Configure Vite to proxy `/api` locally so the web app can use relative URLs.
- Add a Compose service for Mailpit. Use SMTP port 1025 from a host-run API, and open the local inbox on port 8025.

## 4. Verify the first runnable slice

Add `dev`, `test`, and `build` scripts where applicable. Start Mailpit with `docker compose up -d mailpit`, then run `npm --prefix api run dev` and `npm --prefix web run dev` in separate terminals. Confirm that the web app loads one product through the backend and an enquiry produces a message in Mailpit. Run the tests with `npm --prefix api test` and `npm --prefix web test`. Before submission, verify the final README from a fresh clone and streamline reviewer startup to one or two commands where possible.
