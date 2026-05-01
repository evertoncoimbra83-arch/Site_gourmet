# Repository Guidelines

## Project Structure & Module Organization
`client/` contains the Vite React app; most feature work lives under `client/src/pages`, shared UI under `client/src/components`, and app utilities under `client/src/lib` and `client/src/_core`. `server/` contains the Node entrypoint, tRPC routers, services, and backend helpers. `shared/` holds cross-cutting domain types and logic reused by both sides. Database schema lives in `drizzle/`, browser assets in `public/` and `assets/`, unit tests in colocated `server/**/*.spec.ts`, and browser flows in `e2e/` and `tests/`.

## Build, Test, and Development Commands
Use `pnpm`; the repo declares `pnpm@9.4.0`.

- `pnpm dev` runs server and client together.
- `pnpm dev:server` starts the backend with `tsx watch`.
- `pnpm dev:client` starts Vite.
- `pnpm build` builds the client and bundles `server/_core/index.ts` to `dist/index.js`.
- `pnpm start` runs the production bundle.
- `pnpm check` runs TypeScript with `--noEmit`.
- `pnpm test` starts Vitest in watch mode; `pnpm test:run` runs once.
- `pnpm db:push` generates and applies Drizzle migrations.
- `pnpm format` formats the repository with Prettier.

## Coding Style & Naming Conventions
TypeScript runs in `strict` mode. Prettier enforces 2-space indentation, semicolons, double quotes, trailing commas where valid in ES5, and `printWidth: 80`. Prefer PascalCase for React components (`AdminOrdersView.tsx`), camelCase for hooks/utilities (`useAdminOrders.ts`), and kebab-case for router or script filenames where already established (`payment-methods.ts`, `migrate-pii.mjs`). Reuse path aliases such as `@/`, `@shared/`, and `@server/`.

## Testing Guidelines
Vitest is configured for `server/**/*.{test,spec}.ts`; keep unit tests close to the backend code they cover. Playwright uses `e2e/` for end-to-end coverage, with additional UI specs currently present in `tests/`. No coverage threshold is enforced in config, so contributors should add tests for new logic paths and checkout/admin regressions.

## Commit & Pull Request Guidelines
Recent history uses short, imperative commit subjects, often in Portuguese, such as `Initial commit` and `Adicionando código do projeto`. Keep subjects brief and descriptive, ideally focused on one change. Pull requests should include a clear summary, affected areas, environment or migration notes, linked issues, and screenshots for UI changes. Call out schema, `.env`, or seed-data changes explicitly.

## Security & Configuration Tips
Secrets belong in `.env` or `.env.local`; do not commit credentials. Review changes touching `server/_core/env.ts`, auth flows, payment code, and Drizzle schema carefully, and avoid checking large generated files into feature PRs unless they are required outputs.
