# Migration Decisions

> **Location:** this folder exists only in the backend repo (`yotoqxonacom-hub/Furniture/docs/Ai`). It is the single record for **both** the backend and the frontend (`furniture-next`); the frontend repo has no copy and links here.

These decisions are read from the Furniture code (comments, docs and structure). "Why" quotes the reason given in the code where one exists; otherwise it is marked as inferred.

## Architectural Decisions

| Decision | Why It Was Made | Risks | Alternatives |
| --- | --- | --- | --- |
| Hard rename `Property` → `Product` (code, GraphQL, collection). | Furniture is a new product with its own frontend, so no old clients need protecting (inferred). | Nestar data/clients are incompatible; no migration script for `properties` → `products`. | Petoria-style safe rename with GraphQL aliases. |
| Keep `MemberType.AGENT`, `/agent` routes and `agent*` names; say "seller" only in UI. | Avoids touching auth/roles and every agent query (inferred). | Mixed vocabulary in code vs UI. | Rename to `SELLER` with a data migration. |
| Keep real-estate fields and relabel them (Seats, Pieces in set, Size, City, Year made). | Reuses filters, indexes and forms without schema migration (inferred). | Field names mislead new developers; `productBeds` = seats is not obvious. | Rename to `productSize`, `productSeats`, `productPieces`, `productCity`, `madeAt`. |
| Remove `productRent`, keep `productBarter`. | Renting furniture is not offered; barter still is (inferred). | Old documents may still hold `productRent`. | Keep both and hide in UI. |
| Add `productStock` with default 1 and start-up backfill. | Code comment: products created before stock existed are single pieces. | Backfill runs on every start (cheap `updateMany`, but hidden side effect). | One-off migration script. |
| Reserve stock atomically (`findOneAndUpdate` with `productStock >= qty`). | Code comment: two buyers can't get the last piece. | Stock is reserved at order creation, so abandoned orders hold stock until expiry. | Reserve at payment time. |
| One order per seller per checkout; one payment can cover several orders. | `docs/orders.md`: each seller ships and updates status independently. | More documents per checkout; partial refunds needed. | Single order with mixed sellers. |
| Order status flow table (`ORDER_STATUS_FLOW`) + buyer can cancel only in PENDING/PAID. | Code comment: buyer may cancel only before the seller starts working. | Rules duplicated in frontend UI logic. | State machine library. |
| Cron in API app (`@nestjs/schedule`, every 5 min) cancels unpaid orders after 30 min. | `docs/orders.md`: release stock of unpaid orders. | Runs in every API instance if scaled horizontally. | Move to `furniture-batch`. |
| Payment gateway stub that approves every charge. | `docs/orders.md`: test mode; implement `charge`/`refund` with Toss Payments or PortOne later. | Must not go to production as is. | Integrate a real PG now. |
| Delivery fee 50, free from 1000, max 10 per cart line, duplicated in frontend. | Frontend only previews; backend calculates real totals (code comment). | Values can drift between repos. | Expose rules through a GraphQL query. |
| Notifications created inside services via `notifyTarget()`. | Simple, no event bus (inferred). | Tight coupling: many modules import `NotificationModule`. | Domain events / queue. |
| Private messages stored in MongoDB; public chat kept in memory (last 10). | Private chat must persist; public chat is a light lobby (inferred). | Public history and read receipts reset on restart; single-instance only. | Persist public messages; Redis pub/sub. |
| GraphQL `formatError` always returns a string. | Code comment: returning an object showed "[object Object]" in the frontend. | Loses structured validation details. | Return codes + field errors in `extensions`. |
| Login errors as 400/403 instead of 500. | Commit message: 4xx codes for login errors. | — | — |
| Escape regex in all text search (`textRegex`). | Code comment: inputs like "sofa (2)" threw "Invalid regular expression". | — | Mongo text index. |
| Whitelist upload targets and create folders on demand. | Prevent path abuse and missing-folder errors (inferred from `prepareUploadFolder`). | Files still stored on local disk. | Object storage (S3 etc.). |
| Admin self-lock guard. | Code comment: instant lock-out if an admin demotes/blocks themself. | — | — |
| Frontend: one responsive markup, admin desktop-only. | Code comment in `useDeviceDetect`: CSS media queries handle phones. | Admin unusable on phones. | Keep separate mobile components. |
| Frontend: WebSocket outside Apollo (`libs/socket.ts`). | One socket per tab with reconnect and reactive vars (code comment). | Custom protocol, not GraphQL subscriptions. | GraphQL subscriptions. |
| Frontend: English sentences as i18n keys, separators off. | Code comment: ':' and '.' in keys caused wrong text and hydration errors. | Changing English copy changes the key in all locales. | Semantic keys. |
| Frontend: errors — mutations alert in caller, queries alert unless `silent`. | Code comment: Swal shows one popup at a time; a second alert closed the first. | Callers must remember to catch. | Central toast system. |

## Validation Decisions (this session)

| Check | Decision | Result |
| --- | --- | --- |
| Compare branches | Use `develop` of all repos (newest code). | Furniture `master` is behind; documented. |
| Diff method | Normalise names first, then diff. | Pure renames separated from real changes. |
| Build/typecheck | Try in a scratch copy only. | Install blocked (registry 403); not run. |
| Repository writes | None. | Docs delivered for review, not pushed. |

## Decision Boundaries

- Any rename of legacy fields (`productBeds`, `productSquare`, …) or of `AGENT` is a breaking API + data change and needs a separate plan.
- Real payments, horizontal scaling (cron + in-memory chat) and object storage are open decisions, not done.
