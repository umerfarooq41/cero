# Typography and Consistency Changes Applied

This zip applies a global visual consistency pass without changing budget/business logic.

## Main changes
- Standardized page title scale through `PageHeader.jsx`.
- Standardized shared buttons, inputs, selects, tabs, and cards through UI primitives.
- Standardized cards to `rounded-2xl border border-border/60 bg-card/70 backdrop-blur-lg shadow-sm`.
- Standardized hero cards to `rounded-3xl` with medium shadow.
- Reduced oversized Accounts typography and spacing.
- Normalized Plan summary cards and Left To Allocate banner text sizing/depth.
- Normalized Reflect card surface depth and large amount sizing.
- Normalized Transaction rows to consistent row height, title size, subtitle size, and amount weight.
- Added `src/lib/uiStyles.js` as a reusable typography/control/surface token file for future pages.

## Build status
`npm run build` completed successfully after installing dependencies from `package-lock.json`.

## Build warning
Vite still shows the existing large chunk warning. This is not caused by the typography changes; it means the app bundle could later benefit from route-level code splitting.


## Additional Pass - Plan Glass + Desktop Consistency

- Updated Plan month/edit header from `surface-card card-elevated` to the same glass card style used elsewhere.
- Updated Plan overview tabs, donut card, and breakdown card to `border-border/60 bg-card/70 backdrop-blur-xl shadow-sm`.
- Fixed typo `shadow-sms` to `shadow-sm` in `SummaryCards.jsx`.
- Widened desktop content containers from `max-w-3xl` / `lg:max-w-4xl` to `max-w-6xl` where appropriate.
- Widened Settings desktop content from `max-w-2xl` to `max-w-4xl`.
- Verified with `npm run build`.
