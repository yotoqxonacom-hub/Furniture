# Completed Tasks

> **Location:** this folder exists only in the backend repo (`yotoqxonacom-hub/Furniture/docs/Ai`). It is the single record for **both** the backend and the frontend (`furniture-next`); the frontend repo has no copy and links here.

## Session Summary

Date: Monday, October 5, 2026.

This session was a **read-only comparison** of four GitHub repositories:

| Pair | From | To |
| --- | --- | --- |
| Backend | `Nestar` (`develop`, `7ff1607`) | `Furniture` (`develop`, `c316a79`) |
| Frontend | `Nestar-next` (`develop`, `4937b72`) | `furniture-next` (`develop`, `09d212f`) |

Method: shallow clones, a copy of each Nestar repo with names normalised (`property → product`, `nestar → furniture`), then a recursive diff. Files that differed only by name were treated as "renamed, logic unchanged"; everything else was read and documented.

No application source code was changed and nothing was committed or pushed.

Documentation placement (second request, same day): all change documents for backend **and** frontend were consolidated into the backend repo's `docs/Ai/` folder only (local working copy, not committed). `AGENTS.md` and `SKILLS.md` were updated for both repos so they point to `Furniture/docs/Ai`.

| Deliverable | Location |
| --- | --- |
| 6 change documents | `Furniture/docs/Ai/` (backend repo only) |
| Backend `AGENTS.md`, `SKILLS.md` | `Furniture/` root |
| Frontend `AGENTS.md`, `SKILLS.md` | `furniture-next/` root (reference backend `docs/Ai`) |

## Backend Work Already Done in Furniture (compared to Nestar)

| Area | Completed Change |
| --- | --- |
| Identity | Apps, Nest projects, package, dist paths and welcome strings renamed to Furniture. |
| Domain rename | `Property` → `Product` in modules, DTOs, enums, schema, GraphQL and collection (`products`). |
| Categories | `ProductType` = SOFA, CORNER_SOFA, ARMCHAIR, BED, POUF, MATTRESS, KIDS; article category HUMOR → INTERIOR; notice category NOTICE added. |
| Product fields | `productStock` added (with start-up backfill); `productRent` removed. |
| Stock | Atomic `reserveStock` / `releaseStock`; auto SOLD at 0, re-activate when an order releases stock. |
| Cart | Cart module + `cartItems` collection. |
| Orders | Order module, `orders` + `orderItems`, per-seller split, status flow, 30-minute expiry cron. |
| Payments | Payment module + `payments`; gateway stub in test mode. |
| Messages | Private messages module + `messages`; live delivery via socket. |
| Notices | Notice module (public + admin CRUD). |
| Notifications | Notification module; notifications on like, comment and order events. |
| Reports | Report module + `reports`; admin resolve/reject. |
| Errors | GraphQL errors always a readable string; login/signup return 400/403 with specific messages. |
| Search | `textRegex()` escapes user input in every text search. |
| Uploads | `prepareUploadFolder()` whitelists `member`, `product`, `article` and creates folders. |
| Admin safety | Admin cannot change their own type/status. |
| Follow info | `meFollowed` on product seller, article author and agents list. |
| Socket | Gateway rewritten (ids, timestamps, read receipts, per-member sockets, `emitToMembers`, `isOnline`). |
| Docs/env | `docs/orders.md`, `.env.example`. |
| Cleanup | Stray `board-article.input (1).ts` removed; `strictPropertyInitialization` key fixed in `tsconfig.json`. |

## Frontend Work Already Done in Furniture-next (compared to Nestar-next)

| Area | Completed Change |
| --- | --- |
| Identity | Package, branding, theme colours, Manrope font, page photos, SVG icons. |
| Layout | PC/mobile SCSS trees replaced by one responsive `scss/furniture` set + admin styles. |
| Dependencies | 25 unused packages (3D, charts, sliders, pickers …) removed. |
| Routing | `/property` → `/product`; new `/cart`, `/order/checkout`, `/order/detail`, admin orders/reports/notifications; admin inquiry removed. |
| GraphQL | Property documents renamed; 34 new documents for cart, orders, chat, notifications, reports, notices. |
| Chat | Socket moved out of Apollo into `libs/socket.ts`; inbox + public chat with read receipts. |
| Commerce | Cart badge, quantity stepper, checkout, my orders, seller orders, admin orders. |
| Social | Follow buttons, reports modal, notifications bell. |
| Help center | Notices, searchable FAQ (with default fallback), terms. |
| i18n | Uzbek added; English-sentence keys; 582 keys per locale; `i18n:check` script. |
| Env | `libs/env.ts` + `.env.example`. |
| UX | Scroll restoration, quiet query errors, one alert per mutation. |

## Files and Modules Touched (summary)

| Repo | Only in new repo | Changed (beyond rename) | Only in old repo |
| --- | --- | --- | --- |
| Backend | 7 component folders, 9 DTO folders/files, 4 enums, 6 schemas, `.env.example`, `docs/orders.md` | 26 files (see BACKEND_MIGRATION.md) | 1 stray DTO file |
| Frontend | 62 files/folders | 71 files | 30 files/folders |

## Explicitly Not Changed

| Area | Status |
| --- | --- |
| Tech stack and versions | Same NestJS / Next.js / Apollo / MUI versions. |
| Auth flow and JWT guards | Unchanged. |
| `MemberType.AGENT` naming in code and `/agent` routes | Unchanged (only UI says "seller"). |
| Legacy fields `productSquare`, `productBeds`, `productRooms`, `productLocation`, `constructedAt`, `productBarter` | Kept in schema/GraphQL; only relabelled in UI. |
| Batch rank formulas and cron times | Unchanged. |
| Like / view / follow logic | Unchanged. |
| Env variable names | Unchanged. |

## Validation Status

| Check | Command | Status | Notes |
| --- | --- | --- | --- |
| Structural diff | `diff -r` on name-normalised copies | Done | Basis of these documents. |
| Branch check | `git ls-remote --heads` | Done | Furniture `develop` is ahead of `master`; Nestar `master` is only the starter. |
| Install | `npm ci` (in a scratch copy) | Not possible | Package registry returned 403 for a dependency in this environment. |
| Typecheck / build / lint | `npx tsc`, `npm run build`, `npx eslint` | Not run | Blocked by the failed install; run locally (see NEXT_STEPS.md). |

## Notes

- The backend `npm run lint` script uses `--fix`; run `npx eslint "{src,apps,libs,test}/**/*.ts"` for a read-only check.
- During analysis a text-replacement command was accidentally run against the local clones; all four clones were reset with `git reset --hard` and verified clean before the final diff was taken. Nothing left this machine.
