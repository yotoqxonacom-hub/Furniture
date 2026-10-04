# AGENTS.md — Furniture backend

Guide for AI coding agents (Claude, Codex, …) and new developers working in `yotoqxonacom-hub/Furniture`.
Read this file first, then `docs/Ai/*.md` for history and `docs/orders.md` for the commerce flow.
`docs/Ai/` is the **only** change record for both this backend and the frontend `furniture-next` (the frontend repo has no copy).

## Project

Furniture is a furniture marketplace API. Sellers (`MemberType.AGENT`) list products; users like, comment, follow,
message, report, add to cart, order and pay; admins moderate. The code base was migrated from the real-estate
project **Nestar** (`Property` → `Product`), see `docs/Ai/BACKEND_MIGRATION.md`.

| Item | Value |
| --- | --- |
| Stack | NestJS 10 monorepo, GraphQL (Apollo driver, code-first, `autoSchemaFile`), Mongoose, `ws` WebSocket, `@nestjs/schedule` |
| Apps | `apps/furniture-api` (GraphQL + uploads + socket), `apps/furniture-batch` (nightly rank jobs) |
| Main branch with latest code | `develop` (`master` is behind) |
| Frontend | `yotoqxonacom-hub/furniture-next` |

## Commands

```bash
cp .env.example .env              # PORT_API, PORT_BATCH, SECRET_TOKEN, MONGO_DEV, MONGO_PROD
npm ci
npm run start:dev                 # API on PORT_API (3007), playground at /graphql
npm run start:dev:batch           # batch app
npm run build                     # both apps → dist/apps/furniture-*
npx tsc -p apps/furniture-api/tsconfig.app.json --noEmit
npx tsc -p apps/furniture-batch/tsconfig.app.json --noEmit
npx eslint "{src,apps,libs,test}/**/*.ts"   # read-only lint
```

Do **not** run `npm run lint` or `npm run format` as a check — they rewrite files (`--fix`, `--write`).

## Folder Map (`apps/furniture-api/src`)

| Path | Contents |
| --- | --- |
| `components/<name>/` | `<name>.module.ts`, `<name>.resolver.ts`, `<name>.service.ts` per domain |
| `components/components.module.ts` | Registers every domain module |
| `components/auth/` | JWT service, `AuthGuard`, `RolesGuard`, `WithoutGuard`, `@AuthMember`, `@Roles` |
| `components/payment/payment.gateway.ts` | Payment provider adapter (test stub) |
| `schemas/*.model.ts` | Mongoose schemas with explicit `collection` names and indexes |
| `libs/dto/<name>/` | GraphQL `@ObjectType` (`<name>.ts`), `@InputType` (`<name>.input.ts`, `<name>.update.ts`) |
| `libs/enums/*.enum.ts` | Enums + `registerEnumType`; `common.enum.ts` holds `Message` error texts and `Direction` |
| `libs/config.ts` | Sort whitelists, `ORDER_RULES`, upload helpers, `textRegex`, `shapeIntoMongoObjectId`, `$lookup` stages |
| `socket/socket.gateway.ts` | Public chat, read receipts, `emitToMembers`, `isOnline` |
| `app.module.ts` | Config, Schedule, GraphQL (`readableErrorMessage`), DB, socket |

Domains: auth, member, product, board-article, comment, like, view, follow, notice, notification, report, message, cart, order, payment.

## Rules

1. **Never push, merge or open a PR without the owner's explicit approval.** Show the diff first.
2. Keep business logic in services; resolvers only read args, apply guards and call the service.
3. Protect operations with `@UseGuards(AuthGuard)` or `@Roles(MemberType.X) @UseGuards(RolesGuard)`; use `WithoutGuard` for optional auth.
4. Throw Nest HTTP exceptions with a `Message` enum value. Add new texts to `Message` — never raw strings. The client always receives a plain string.
5. Use `textRegex(text)` for every user text search; never `new RegExp(userInput)`.
6. Convert ids with `shapeIntoMongoObjectId`. Validate sort fields against the `available*Sorts` lists.
7. Uploads go through `prepareUploadFolder(target)`; allowed targets are `member`, `product`, `article`.
8. Stock changes only through `ProductService.reserveStock` / `releaseStock` (atomic). Never `$set` stock from an order.
9. Order status changes must respect `ORDER_STATUS_FLOW`; `PENDING → PAID` only via `payOrders`.
10. If you change `ORDER_RULES`, change `furniture-next/libs/config.ts` in the same task.
11. GraphQL renames are breaking for `furniture-next`. List every affected frontend document when you rename.
12. Notifications: `NotificationService.notifyTarget()` for likes/comments, `notifyOrder()` for order events (both skip self and never throw); import `NotificationModule` in the module that uses it.
13. Live events to users: `SocketGateway.emitToMembers(ids, payload)` (import `SocketModule`).
14. Keep legacy field names (`productBeds` = seats, `productRooms` = pieces, `productSquare` = size, `productLocation` = city, `constructedAt` = year made) unless a rename plan is approved.
15. Code style: tabs, single quotes, trailing commas, printWidth 90 (`.prettierrc`). Comments in English.
16. Update `docs/Ai/*.md` when you add a module, change a schema or change a rule. Frontend work is also recorded here (`docs/Ai/FRONTEND_MIGRATION.md`); never create `docs/Ai` in `furniture-next`.

## Domain Cheatsheet

| Concept | Where |
| --- | --- |
| Roles | `MemberType.USER`, `AGENT` (seller), `ADMIN` |
| Product categories | `ProductType`: SOFA, CORNER_SOFA, ARMCHAIR, BED, POUF, MATTRESS, KIDS |
| Product lifecycle | `ProductStatus`: ACTIVE → SOLD (stock 0 or manual) / DELETE |
| Order lifecycle | PENDING → PAID → PROCESSING → SHIPPED → DELIVERED; CANCELLED |
| Order rules | max 10 per cart line, delivery 50, free from 1000, unpaid expiry 30 min (cron every 5 min) |
| Payments | `PaymentMethod`: CARD, KAKAO_PAY, TOSS_PAY, BANK_TRANSFER — gateway is a stub |
| Reports | `ReportGroup`: MEMBER, PRODUCT, ARTICLE; `ReportStatus`: PENDING, RESOLVED, REJECTED |
| Batch | product rank = likes×2 + views; agent rank = products×5 + articles×3 + likes×2 + views (01:00–01:40 cron) |

## Known Gaps

- `libs/dto/member/memberUpdate.ts` is an unused duplicate of `member.update.ts`.
- `furniture-batch` has both `src/lib/config.ts` and `src/libs/config.ts`.
- Public chat history is in memory (resets on restart); expiry cron runs in the API process.
- README is still the Nest starter.

## Definition of Done

- Both apps typecheck and `npm run build` passes.
- New GraphQL operations listed in `docs/Ai/BACKEND_MIGRATION.md`; matching frontend documents exist in `furniture-next/apollo` and are listed in `docs/Ai/FRONTEND_MIGRATION.md`.
- `docs/Ai/COMPLETED_TASKS.md` and `NEXT_STEPS.md` updated.
- No secrets committed (`.env` stays local).
- Diff shown to the owner before any push.
