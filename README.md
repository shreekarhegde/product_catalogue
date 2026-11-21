# Product catalogue

Browse featured products and categories, search the catalogue, and send a product enquiry. The React app uses the Express API for catalogue data and enquiries.

## Local development

Use Node 24.15 or later in the Node 24 line and Mailpit for the local email inbox. Docker is optional. Run the npm commands from the repository root, the folder containing both `api` and `web`.

### Install dependencies

Run each command on its own line. These commands work in Windows PowerShell 5.1, macOS, and Linux.

```sh
npm --prefix api ci
npm --prefix web ci
```

### Start Mailpit

Choose one option. Both provide an SMTP server on port 1025 and a test inbox on port 8025.

**Windows without Docker or WSL**

Download the Windows archive for your CPU from [Mailpit releases](https://github.com/axllent/mailpit/releases) and extract it. Open PowerShell in the extracted folder, run the following command, and leave that window open.

```powershell
.\mailpit.exe --listen 127.0.0.1:8025 --smtp 127.0.0.1:1025
```

**Docker**

With the Docker engine running, run:

```sh
docker run --rm -d --name catalogue-mailpit -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 axllent/mailpit
```

Open `http://127.0.0.1:8025` to check that the inbox is running. If the app reports an email error with native Mailpit running, set `SMTP_HOST=127.0.0.1` in `api/.env` and restart the API.

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

To stop Mailpit, press Ctrl+C in its PowerShell window or run `docker stop catalogue-mailpit` if you started it with Docker.

## Checks

```sh
npm --prefix api test
npm --prefix web test
npm --prefix web run build
```
