# Useful Prompts

> **Location:** this folder exists only in the backend repo (`yotoqxonacom-hub/Furniture/docs/Ai`). It is the single record for **both** the backend and the frontend (`furniture-next`); the frontend repo has no copy and links here.

## Prompts From This Session

### Compare Nestar and Furniture (original request, Uzbek)

```text
githubga bor keyin Nestar va nestar-next keyin esa furniture va furniture-nextni yaxshilab analise qil keyin nestar backend va frontendan furnitur backend va frontendi orasidagi farqlarni tekshirib chiq va barcha o'zgarishlarni bir docs degan folderni ichida Ai degan file och va yuqorida tashlagan filelar nomi bilan tashkilla va barcha o'zgarishlarni yoz ularni ichiga lekin furniture githubga yuklama shu yerda menga filelarni yubor. furniture frontend va backend uchun AGENTS.md va SKILLS.md filelarini tashkil qilib ularni ham mantiqan shakillantir va menga yubor hech qaysi o'zgarishlarni githubga yuborma avval menga taqdimqil
```

Same request in English:

```text
Go to GitHub. Analyse Nestar and Nestar-next, then Furniture and furniture-next. Compare the Nestar backend/frontend with the Furniture backend/frontend and write every change into docs/Ai using the file names BACKEND_MIGRATION.md, DECISIONS.md, FRONTEND_MIGRATION.md, COMPLETED_TASKS.md, NEXT_STEPS.md and PROMPTS.md. Also create AGENTS.md and SKILLS.md for the Furniture backend and frontend. Do not push anything to GitHub — send me the files here for review first.
```

Follow-up constraint:

```text
hech narsa qo'shma men aytgandek davom et faqat tekshir oradagi farqlarni
(Do not add anything to the repos; only check the differences.)
```

### Consolidate docs into the backend (second request, Uzbek)

```text
frontend va backenddagi hamma ozgarishlarni faqat backenddagi docs ni ichidagi ai folderni ichiga yukla hozir hammasini modify qil va frontend va backend AGENTS>md va SKILLS.md ni ham modify qil va menga yubor githubga yuklama
```

Same request in English:

```text
Put all frontend and backend changes only into the backend repo's docs/Ai folder, update every document for that, also update AGENTS.md and SKILLS.md for frontend and backend, send them to me, and do not push to GitHub.
```

## Reusable Prompts for the Next Session

### Refresh the comparison after new commits

```text
Clone yotoqxonacom-hub/Furniture and yotoqxonacom-hub/furniture-next (develop branches) read-only. Compare them with the state described in docs/Ai/BACKEND_MIGRATION.md and docs/Ai/FRONTEND_MIGRATION.md. List what changed since commits c316a79 (backend) and 09d212f (frontend) and update only Furniture/docs/Ai (backend repo; it also holds the frontend record). Do not edit source code and do not push.
```

### Validate builds locally

```text
In the Furniture backend run npm ci, npx tsc -p apps/furniture-api/tsconfig.app.json --noEmit, npx tsc -p apps/furniture-batch/tsconfig.app.json --noEmit, npm run build and the read-only eslint command (not npm run lint, it uses --fix). In furniture-next run yarn install, npx tsc --noEmit, yarn build and yarn i18n:check. Report results; do not fix anything yet.
```

### Order flow review

```text
Review the cart → order → payment flow in Furniture (components/cart, order, payment, product reserveStock/releaseStock, docs/orders.md). Check stock races, refunds, status transitions in ORDER_STATUS_FLOW and the expiry cron. Produce findings with file/line references. Do not change code.
```

### Real payment gateway plan

```text
Plan how to replace components/payment/payment.gateway.ts (test stub) with Toss Payments or PortOne in Furniture. Keep the PaymentGateway charge/refund interface, list required env variables, webhook handling, idempotency with transactionKey, and frontend checkout changes. Plan only.
```

### Legacy field rename plan

```text
Plan renaming the real-estate legacy fields in Furniture: productBeds (seats), productRooms (pieces in set), productSquare (size cm), productLocation (city), constructedAt (year made). Cover schema, DTOs, GraphQL, unique index, batch, furniture-next queries/forms/filters, locale files and a MongoDB migration script. Plan only.
```

### New feature with both repos

```text
Add <feature> to Furniture. Follow AGENTS.md and SKILLS.md in both repos: backend module pattern (schema → enum → DTO → service → resolver → components.module), then furniture-next (types → apollo document → hook/component → page → 4 locale files). Keep ORDER_RULES in sync and record the change in Furniture/docs/Ai. Show me the diff before committing; do not push.
```

### Documentation update

```text
Update Furniture/docs/Ai in the backend repo (BACKEND_MIGRATION.md, DECISIONS.md, FRONTEND_MIGRATION.md, COMPLETED_TASKS.md, NEXT_STEPS.md, PROMPTS.md) plus AGENTS.md and SKILLS.md in both repos so they match the current state. Frontend changes are recorded in Furniture/docs/Ai/FRONTEND_MIGRATION.md; furniture-next has no docs/Ai folder. Only edit documentation files.
```
