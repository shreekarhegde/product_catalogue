# Product catalogue

Browse featured products and categories, search the catalogue, and send a product enquiry. The React app uses the Express API for catalogue data and enquiries.

## Local development

Use Node 24.15 or later in the Node 24 line and Docker for the local email inbox. Run all commands from the repository root, the folder containing both `api` and `web`.

### Install dependencies and start Mailpit

Run each command on its own line. These commands work in Windows PowerShell 5.1, macOS, and Linux.

```sh
npm --prefix api ci
npm --prefix web ci
docker run --rm -d --name catalogue-mailpit -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 axllent/mailpit
```

### Start the API

In the first terminal, use the commands for your shell to enable the bundled sample catalogue.

**Windows PowerShell**

```powershell
$env:USE_SAMPLE_CATALOGUE = "true"
npm --prefix api run dev
```

**macOS or Linux (Bash or Zsh)**

```sh
USE_SAMPLE_CATALOGUE=true npm --prefix api run dev
```

### Start the frontend

In a second terminal at the repository root, run:

```sh
npm --prefix web run dev
```

Open the URL printed by Vite. Search for “Travel Bag”, open the item, and submit an enquiry. Check for the message in Mailpit at `http://localhost:8025`.

The API uses Fake Store API by default. To return to live data after using the PowerShell commands above, stop the API with Ctrl+C, run `Remove-Item Env:USE_SAMPLE_CATALOGUE`, then run `npm --prefix api run dev` again. In Bash or Zsh, restart the API without the inline variable assignment.

The API defaults are in `api/.env.example`. Copy it to `api/.env` if you need to override them. The Vite proxy uses port 3001 by default. Set `CATALOGUE_API_URL` when starting Vite if your API is listening elsewhere.

Stop the local inbox with `docker stop catalogue-mailpit`.

## Checks

```sh
npm --prefix api test
npm --prefix web test
npm --prefix web run build
```
