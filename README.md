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
