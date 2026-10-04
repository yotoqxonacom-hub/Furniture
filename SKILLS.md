# SKILLS.md — Furniture backend

Step-by-step recipes for common jobs in this repo. Each skill lists the files to touch in order.
Rules from `AGENTS.md` always apply (no push without approval, `Message` enum for errors, `textRegex` for search).

---

## Skill 1 — Add a new domain module

Use for any new feature with its own collection (e.g. reviews, coupons, wishlists).

1. **Enum** — `libs/enums/<name>.enum.ts`: values + `registerEnumType(X, { name: 'X' })`.
2. **Schema** — `schemas/<Name>.model.ts`: `new Schema({...}, { timestamps: true, collection: '<camelPlural>' })`, add indexes (unique where duplicates are not allowed).
3. **DTOs** — `libs/dto/<name>/`:
   - `<name>.ts` → `@ObjectType()` with `@Field` for every exposed field, plus a list type `{ list, metaCounter }`.
   - `<name>.input.ts` → `@InputType()` with `class-validator` decorators; inquiry input with `page`, `limit`, `sort` (`@IsIn(available<Name>Sorts)`), `direction`.
   - `<name>.update.ts` if updates are allowed.
4. **Config** — add `available<Name>Sorts` (and `$lookup` helpers if needed) to `libs/config.ts`.
5. **Service** — `components/<name>/<name>.service.ts`: `@InjectModel('<Name>')`; aggregation with `$match` → `$sort` → `$facet { list: [$skip, $limit, lookups], metaCounter: [$count] }`.
6. **Resolver** — `components/<name>/<name>.resolver.ts`: guards + `@AuthMember('_id')`; convert ids with `shapeIntoMongoObjectId`.
7. **Module** — `components/<name>/<name>.module.ts`: `MongooseModule.forFeature([{ name, schema }])`, `AuthModule`, other modules it uses; export the service if others need it.
8. **Register** — add the module to `components/components.module.ts`.
9. **Errors** — new texts in `Message` (`libs/enums/common.enum.ts`).
10. **Check** — typecheck both apps, run the operation in the playground.
11. **Frontend handoff** — list new operations for `furniture-next` (types, apollo documents, pages).
12. **Docs** — add the module to `docs/Ai/BACKEND_MIGRATION.md` and `AGENTS.md`; if the frontend uses it, also to `docs/Ai/FRONTEND_MIGRATION.md`.

---

## Skill 2 — Add a field to Product

1. `schemas/Product.model.ts` — field with default (so old documents stay valid).
2. `libs/dto/product/product.ts` — `@Field`.
3. `libs/dto/product/product.input.ts` and `product.update.ts` — optional field with validators.
4. If filterable: `ProductsInquiry` search input + `$match` in `ProductService.getProducts`; if sortable: `availableProductSorts`.
5. If existing data needs a value: one-off migration or `onModuleInit` backfill (see `productStock`).
6. Frontend: `libs/types/product/*`, GraphQL fragments in `apollo/user/query.ts`, form `AddNewProduct.tsx`, filter, locale keys.

---

## Skill 3 — Add a GraphQL query or mutation to an existing module

1. Input DTO (validators) → service method → resolver method with the right guard.
2. Admin-only: `@Roles(MemberType.ADMIN) @UseGuards(RolesGuard)` and name it `...ByAdmin`.
3. Seller-only: `@Roles(MemberType.AGENT)`.
4. Return DTO types, never raw Mongoose documents with private fields (e.g. `memberPassword`).

---

## Skill 4 — Change order, stock or payment behaviour

1. Read `docs/orders.md` and `libs/enums/order.enum.ts` (`ORDER_STATUS_FLOW`, `BUYER_CANCELLABLE`).
2. Stock: only `ProductService.reserveStock` / `releaseStock`.
3. Status: validate against `ORDER_STATUS_FLOW`; set the matching timestamp (`paidAt`, `processedAt`, `shippedAt`, `deliveredAt`, `cancelledAt`).
4. Cancelling a paid order → refund through `PaymentGateway.refund` and update `paymentStatus` / `refundedAmount`.
5. Notify the other side with `NotificationService.notifyOrder({ authorId, receiverId, orderId, orderStatus, summary })` (never throws, skips self).
6. Rules (`ORDER_RULES`) changed → update `furniture-next/libs/config.ts` too.
7. Test: two buyers / last piece, cancel at each status, expiry after `PENDING_TTL_MINUTES`.

---

## Skill 5 — Connect a real payment provider

1. Keep the `PaymentGateway` interface: `charge({ amount, method, … }) → { transactionKey, approvedAt }`, `refund(transactionKey, amount)`.
2. Add provider keys to `.env.example` (names only, no secrets).
3. Use `transactionKey` (unique index) for idempotency.
4. Add webhook/confirm endpoint if the provider needs it; never mark orders `PAID` before confirmation.
5. Update `docs/orders.md` and the checkout page in `furniture-next`.

---

## Skill 6 — Send notifications and live socket events

1. Import `NotificationModule` in your module; inject `NotificationService`.
2. Call `notifyTarget({ notificationType, notificationGroup, authorId, refId })` after the action succeeds (it ignores self-actions and failures).
3. For live updates import `SocketModule`, inject `SocketGateway`, call `emitToMembers([ids], { event: '<name>', ... })`.
4. Add the event handling in `furniture-next/libs/socket.ts`.

---

## Skill 7 — Image upload

1. Use the existing `imageUploader` / `imagesUploader` mutations (`member.resolver.ts`).
2. New target folder → add it to `validUploadTargets` in `libs/config.ts`.
3. Only `image/png`, `image/jpg`, `image/jpeg`; files are served from `/uploads`.

---

## Skill 8 — Batch / rank job

1. Jobs live in `apps/furniture-batch/src/batch.service.ts`, schedules in `batch.controller.ts` (`@Cron`, names in `libs/config.ts`).
2. Import DTOs/enums from `../../furniture-api/src/...` (shared code).
3. Typecheck `apps/furniture-batch/tsconfig.app.json`.

---

## Skill 9 — Safe review before delivery

1. `git status` / `git diff --stat` — only intended files.
2. Typecheck both apps, `npm run build`, read-only eslint.
3. Search for leftovers: `rg -n "Nestar|nestar|propert" apps` (should be empty except intentional notes).
4. Update `docs/Ai/COMPLETED_TASKS.md` and `NEXT_STEPS.md` (they cover backend and frontend).
5. Present the diff to the owner; push only after approval.

---

## Skill 10 — Record a change in docs/Ai

`docs/Ai/` lives only in this backend repo and is the record for both repos.

| Change | File |
| --- | --- |
| Backend module, schema, GraphQL, rule | `BACKEND_MIGRATION.md` |
| Frontend page, component, document, i18n, style | `FRONTEND_MIGRATION.md` |
| Why a design choice was made | `DECISIONS.md` |
| Finished work + validation results | `COMPLETED_TASKS.md` |
| Open work | `NEXT_STEPS.md` |
| Prompt worth reusing | `PROMPTS.md` |

Keep tables, add the date, never duplicate the folder into `furniture-next`.
