# Folio Portfolio

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/NbrMx3/folio/tree/main/client/vite-project)

### Manual Steps
1. Push all changes to GitHub (already done).
2. Click the button above or import your repo at https://vercel.com/import.
3. Set the project root to `client/vite-project` when prompted.
4. Set build command: `pnpm run build` (or `npm run build`)
5. Set output directory: `dist`
6. Set install command: `pnpm install` (or `npm install`)
7. (Optional) Set environment variables if your frontend needs to talk to a backend.
8. Deploy and enjoy your live site!

---

## Backend (Express API)
Vercel is not designed for persistent Node.js servers. Deploy your backend separately (e.g., Render, Railway, Heroku) and set your frontend API URL accordingly.

### SMTP (Forgot Password)
To enable admin password reset emails, configure these server environment variables:

```
ADMIN_RECOVERY_EMAIL=kipkemoi386@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-email@gmail.com
```

Notes:
- Use a Gmail App Password for `SMTP_PASS` (not your normal Gmail password).
- `ADMIN_RECOVERY_EMAIL` is the only inbox allowed to request forgot-password.
- In production on Render, set these in service environment variables (already declared in `render.yaml`).

### Optional: Traccar (GPRS) Analytics Integration
To pull live telemetry metrics into the Admin Analytics dashboard, set:

```
TRACCAR_BASE_URL=https://your-traccar-host
TRACCAR_USERNAME=admin@example.com
TRACCAR_PASSWORD=your-password
TRACCAR_SESSION_PATH=/api/session
TRACCAR_TIMEOUT_MS=7000
```

Notes:
- Integration is optional. If these variables are not set, local analytics still works as before.
- Use `TRACCAR_BASE_URL` as your host only (for example `https://demo.traccar.org`), not `.../api`.
- `TRACCAR_SESSION_PATH` and `TRACCAR_TIMEOUT_MS` are optional overrides.
