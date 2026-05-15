# Glass/Desktop Consistency Update

Applied to requested screens:

- EditPlan page
- AddTransaction page
- Reflect page
- Transactions page
- Edit Account page / Account detail surfaces
- Add Account page

Main changes:

- Replaced remaining `surface-card card-elevated` page panels with the shared glass system.
- Standardized card depth to `border-border/60 bg-card/70 backdrop-blur-xl shadow-sm`.
- Standardized hero/deep cards to `border-border/60 bg-card/75 backdrop-blur-xl shadow-md`.
- Updated month/date headers on EditPlan and Transactions.
- Updated Reflect reporting period selector and summary cards.
- Increased desktop width for Add Transaction and Add Account from `max-w-lg` to `max-w-3xl`.
- Increased Reflect desktop width from `max-w-5xl` to `max-w-6xl`.

Build check:

- `npm run build` completed successfully.
