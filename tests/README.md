# Cero automated tests

Cero uses Node's built-in test runner. No extra test framework, browser service,
test database, Vercel project, or production credentials are required.

## Run locally

- `npm test` — run all isolated unit tests.
- `npm run test:watch` — rerun tests when files change.
- `npm run check` — run tests, ESLint, and the production build.

The tests exercise pure business logic only. They do not connect to Supabase,
create or edit accounts, post transactions, or touch live user data.

## Current coverage

- Budget month parsing, month navigation, filters, surplus and auto-sweep calculations.
- Savings goal schedules, installment amounts, progress, funding and due status.
- Recurring transaction date calculations, status and ordering.
- Transaction-to-account balance effects for assets and liabilities.
- Currency lookup and formatting.

Database RPCs and authenticated UI workflows still require separate integration
coverage. Do not point write-capable browser tests at the production Supabase
project.
