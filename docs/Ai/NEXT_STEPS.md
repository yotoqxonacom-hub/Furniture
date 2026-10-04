# Next Steps

> **Location:** this folder exists only in the backend repo (`yotoqxonacom-hub/Furniture/docs/Ai`). It is the single record for **both** the backend and the frontend (`furniture-next`); the frontend repo has no copy and links here.

Written on Monday, October 5, 2026. Tasks are in priority order. Nothing below has been started.

## Repository Hygiene

| Priority | Task | Purpose |
| --- | --- | --- |
| 1 | Decide the main branch for `Furniture`: merge `develop` (cart/order/payment) into `master`, or document that `develop` is main. | `master` is behind and misses the commerce modules. |
| 2 | Clean up Furniture branches `feature/cart-order-payment`, `fix/restore-develop`, `feature/notice-notification` after merging. | Avoid restoring old code by mistake. |
| 3 | Update `furniture-next/README.md` — it points to backend branch `feature/notice-notification`. | Frontend needs the backend `develop` branch. |
| 4 | Replace the Nest starter README in `Furniture` with real setup, env and module docs. | Onboarding. |
| 5 | After review, commit `docs/Ai/`, `AGENTS.md`, `SKILLS.md` to `Furniture`, and only `AGENTS.md`, `SKILLS.md` to `furniture-next`. | One shared docs folder in the backend; no duplicate in the frontend. |

## Backend Cleanup

| Priority | Task | Purpose |
| --- | --- | --- |
| 1 | Remove unused duplicate `libs/dto/member/memberUpdate.ts` (nothing imports it; `member.update.ts` is used). | Dead code. |
| 2 | Merge `furniture-batch/src/lib/config.ts` and `libs/config.ts` (two config folders inherited from Nestar). | Dead code. |
| 3 | Write a data migration if old Nestar data must be reused (`properties` → `products`, `property*` → `product*`, `memberProperties` → `memberProducts`, drop `propertyRent`). | Data portability. |
| 4 | Decide whether to rename legacy fields (`productBeds` → seats, `productRooms` → pieces, `productSquare` → size, `constructedAt` → madeAt). | Clear domain model; breaking change. |
| 5 | Implement real `PaymentGateway.charge/refund` (Toss Payments or PortOne). | Production payments. |
| 6 | Move `expirePendingOrders` cron to `furniture-batch` or add a lock. | Safe horizontal scaling. |
| 7 | Persist public chat or move socket state to Redis. | Chat survives restarts / multiple instances. |
| 8 | Consider product rank including sales (orders) in the batch formula. | Better "top products" for a shop. |
| 9 | Plan the lint baseline cleanup separately (script uses `--fix`). | Avoid mixing style churn with features. |

## Frontend Cleanup

| Priority | Task | Purpose |
| --- | --- | --- |
| 1 | Replace the placeholder Facebook link in `CONTACTS`. | Real contact info. |
| 1 | Fix README: helper is `openChatWith` (not `openPrivateChat`). | Accurate docs. |
| 2 | Run `yarn i18n:check` after every UI text change. | Keep 4 locales complete. |
| 3 | Consider exposing `ORDER_RULES` from the backend instead of copying them. | Remove duplicated business rules. |
| 4 | Check remaining `agent` wording in UI copy vs "seller". | Consistent terminology. |

## Testing

| Priority | Task | Purpose |
| --- | --- | --- |
| 1 | Backend: `npm ci`, `npx tsc -p apps/furniture-api/tsconfig.app.json --noEmit`, `npx tsc -p apps/furniture-batch/tsconfig.app.json --noEmit`, `npm run build`. | Could not run in this session (registry 403). |
| 2 | Backend: `npx eslint "{src,apps,libs,test}/**/*.ts"` (read-only). | Lint baseline. |
| 3 | Frontend: `yarn install`, `npx tsc --noEmit`, `yarn build`, `yarn i18n:check`. | Type/build/i18n status. |
| 4 | Smoke test the full order flow: add to cart → `createOrders` → `payOrders` → seller PROCESSING/SHIPPED/DELIVERED → cancel/refund → expiry after 30 min. | Commerce correctness. |
| 5 | Concurrency test: two buyers order the last piece at the same time. | Stock reservation. |
| 6 | Socket test: private message delivery, read receipts, reconnect, guest vs member. | Chat reliability. |

## Documentation

| Priority | Task | Purpose |
| --- | --- | --- |
| 1 | Keep `Furniture/docs/Ai/*.md` updated after each backend **or** frontend feature (frontend changes go into `FRONTEND_MIGRATION.md` here). | Single record for both repos. |
| 2 | Add a GraphQL operation list (or exported schema) to the backend docs. | Frontend/backend contract. |
| 3 | Record decisions on legacy field rename and payment provider when made. | Avoid rediscovery. |
