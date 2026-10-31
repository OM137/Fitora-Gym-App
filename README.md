# FITORA

FITORA is a fitness tracking app for workouts, meals, activity, member profiles, and gym communities. It is built with React Router, Vite, and the Agent-Native framework.

## Run locally

Requirements: Node.js 22.22 or newer and pnpm 10.14 (the repository's `packageManager` field lets Corepack select pnpm).

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

For local development without sign-in, set `AUTH_DISABLED=true` in `.env`. Do not set this in production.

## Production deployment

The root `render.yaml` configures a Render web service and managed PostgreSQL database. Apply it from the Render Blueprint dashboard after connecting this GitHub repository. It configures a generated `BETTER_AUTH_SECRET`, injects the database URL, applies production migrations before each deploy, and starts the app with `pnpm start`.

The Blueprint uses paid Render plans. Review the selected service and database plans and available credits in Render before applying; usage can be billed after credits are exhausted. Keep all secrets in Render environment settings, never in Git.

## Project layout

- `app/`: routes and UI components
- `actions/`: operations used by the UI
- `server/`: server plugins and database client
- `drizzle/`: PostgreSQL schema and migrations
- `render.yaml`: Render service and database configuration

Run `pnpm typecheck` and `pnpm build` to verify the app locally.
