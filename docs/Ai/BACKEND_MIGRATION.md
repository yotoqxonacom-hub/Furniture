# Backend Migration: Nestar to Furniture

> **Location:** this folder exists only in the backend repo (`yotoqxonacom-hub/Furniture/docs/Ai`). It is the single record for **both** the backend and the frontend (`furniture-next`); the frontend repo has no copy and links here.

Compared revisions (read-only analysis, nothing was pushed):

| Repo | Branch | Commit | Date |
| --- | --- | --- | --- |
| `yotoqxonacom-hub/Nestar` | `develop` | `7ff1607` "fix: modify websockrt logic" | 2026-10-02 |
| `yotoqxonacom-hub/Furniture` | `develop` | `c316a79` "fix: modify enums" | 2026-10-03 |

> Furniture `master` (`9788acb`) is **behind** `develop`: it does not contain cart / order / payment.
> Nestar `master` (`27e9780`) is only the empty Nest starter; the real Nestar code lives on `develop`.

## Original Project Summary

| Area | Nestar State |
| --- | --- |
| Platform identity | Nestar |
| Backend framework | NestJS monorepo, GraphQL (Apollo, code-first), WebSocket (`ws`) |
| Main apps | `nestar-api`, `nestar-batch` |
| Domain | Real-estate marketplace |
| Core domain module | `Property` listings created by `MemberType.AGENT` members |
| Persistence | MongoDB + Mongoose, collection `properties` |
| Active modules | auth, member, property, board-article, comment, like, view, follow, socket |
| Prepared but unused | `Notice.model.ts`, `Notification.model.ts`, `notice.enum.ts`, `notification.enum.ts` (schemas without modules/resolvers) |

## New Project Summary

| Area | Furniture State |
| --- | --- |
| Platform identity | Furniture |
| Backend framework | Same stack (NestJS monorepo, GraphQL, `ws`, `@nestjs/schedule`) |
| Main apps | `furniture-api`, `furniture-batch` |
| Domain | Furniture marketplace (sofas, beds, mattresses …) with cart, orders and payments |
| Core domain module | `Product` listings created by `MemberType.AGENT` members (shown as "sellers" in UI) |
| Persistence | MongoDB + Mongoose, collection `products` + 6 new collections |
| Active modules | all Nestar modules + report, notice, notification, message, cart, order, payment |

Unlike the earlier Petoria plan (safe identity rename only), Furniture is a **hard rename plus new features**:
`Property` was renamed to `Product` everywhere (code, GraphQL, MongoDB collection), and a full commerce layer was added.

## Backend Migration Goal (as implemented)

- Rename project/app identity from Nestar to Furniture.
- Rename the domain entity `Property` → `Product` in code, GraphQL schema and Mongo collection.
- Replace real-estate categories with furniture categories; keep other legacy fields but give them furniture meaning in the UI.
- Activate notice / notification modules and add report, private message, cart, order and payment modules.
- Harden error messages, search regex, uploads and the WebSocket gateway.

## Naming Changes Completed

| Old Name | New Name | Notes |
| --- | --- | --- |
| `apps/nestar-api` | `apps/furniture-api` | API app folder. |
| `apps/nestar-batch` | `apps/furniture-batch` | Batch app folder. |
| Nest projects `nestar-api` / `nestar-batch` | `furniture-api` / `furniture-batch` | `nest-cli.json`. |
| Package `nestar` | `furniture` | `package.json`, `package-lock.json`. Dependencies are identical. |
| Dist paths `dist/apps/nestar-*` | `dist/apps/furniture-*` | Scripts + app tsconfigs. |
| Welcome strings | "Welcome to Furniture Rest API Server!", "Welcome to Furniture BATCH Server!" | `app.service.ts`, `batch.service.ts`. |
| `components/property/*` | `components/product/*` | Module, resolver, service. |
| `libs/dto/property/*` | `libs/dto/product/*` | `Product`, `Products`, `ProductInput`, `ProductUpdate`, `ProductsInquiry`, `AgentProductsInquiry`, … |
| `libs/enums/property.enum.ts` | `libs/enums/product.enum.ts` | `ProductType`, `ProductStatus`, `ProductLocation`. |
| `schemas/Property.model.ts` | `schemas/Product.model.ts` | Model `Product`, collection `products`. |
| All `property*` fields | `product*` fields | e.g. `propertyTitle` → `productTitle`, `propertyPrice` → `productPrice`. |
| `memberProperties` (member counter) | `memberProducts` | `Member.model.ts`. |
| `LikeGroup/ViewGroup/CommentGroup.PROPERTY` | `.PRODUCT` | Enum values. |
| `availablePropertySorts` | `availableProductSorts` | `libs/config.ts`. |
| `tsconfig.json` | — | Fixed `strictPropertyInitialization` key (a blind rename had produced an invalid key). |
| `.env` | `.env.example` added | `PORT_API=3007`, `PORT_BATCH=3008`, `SECRET_TOKEN`, `MONGO_DEV=…/furniture`, `MONGO_PROD`. |
| — | `docs/orders.md` added | Cart / order / payment flow documentation. |
| Stray file `libs/dto/board-articles/board-article.input (1).ts` | removed | Duplicate file from Nestar. |

Files that differ **only** by the rename (same logic): `product.resolver.ts`, like/view/follow services and resolvers, auth module/guards, `Member.model.ts`, `BoardArticle.model.ts`, `Comment.model.ts`, `Like.model.ts`, `View.model.ts`, `Follow.model.ts`, `Notice.model.ts`, member enum, view/like/comment enums, the whole batch app (rank formulas unchanged).

## Domain Value Changes

| Item | Nestar | Furniture |
| --- | --- | --- |
| `ProductType` (was `PropertyType`) | `APARTMENT`, `VILLA`, `HOUSE` | `SOFA`, `CORNER_SOFA`, `ARMCHAIR`, `BED`, `POUF`, `MATTRESS`, `KIDS` |
| `ProductStatus` | `ACTIVE`, `SOLD`, `DELETE` | unchanged |
| `ProductLocation` | Korean cities (SEOUL … JEJU) | unchanged (UI label "City") |
| `BoardArticleCategory` | `FREE`, `RECOMMEND`, `NEWS`, `HUMOR` | `HUMOR` → `INTERIOR` |
| `NoticeCategory` | `FAQ`, `TERMS`, `INQUIRY` | + `NOTICE` |
| `NotificationType` | `LIKE`, `COMMENT` | + `ORDER` |
| `NotificationGroup` | `MEMBER`, `ARTICLE`, `PRODUCT` | + `ORDER` |
| `MemberType` | `USER`, `AGENT`, `ADMIN` | unchanged (AGENT = seller) |
| `availableOptions` | `propertyBarter`, `propertyRent` | `productBarter` only |
| `Message` (errors) | — | + `USED_MEMBER_NICK`, `USED_MEMBER_PHONE`, `CART_EMPTY`, `CART_LIMIT`, `OUT_OF_STOCK`, `PRODUCT_NOT_AVAILABLE`, `OWN_PRODUCT`, `ORDER_NOT_PAYABLE`, `ORDER_STATUS_DENIED`, `PAYMENT_FAILED` |

Legacy real-estate fields kept in the `Product` schema (re-labelled only in the frontend):

| Field | Furniture meaning (UI label) |
| --- | --- |
| `productSquare` | Size (cm) |
| `productBeds` | Seats |
| `productRooms` | Pieces in set |
| `productLocation` | City |
| `constructedAt` | Year made |
| `productBarter` | Barter |
| `productRent` | **Removed** from schema, DTOs and `availableOptions` |

## Module Changes

| Module Area | Status in Furniture |
| --- | --- |
| Auth | Unchanged (JWT, `AuthGuard`, `RolesGuard`, `WithoutGuard`). |
| Member | Signup reports which field is taken (E11000 → `USED_MEMBER_NICK` / `USED_MEMBER_PHONE`); login uses 400/403 instead of 500; `checkSubscription` made public; `getAgents` adds `meFollowed`; like on a member sends a notification; admin cannot change own type/status (`updateMembersByAdmin` self-lock guard); uploads go through `prepareUploadFolder`. |
| Product (was Property) | Same operations; `productStock` added and backfilled to `1` on start (`onModuleInit`); `reserveStock` / `releaseStock` (atomic, auto `SOLD` ↔ `ACTIVE`); `getProduct` returns seller `meFollowed`; like sends notification; escaped text search. |
| Board article | Like sends notification; detail returns author `meFollowed`; escaped text search. |
| Comment | Creating a comment sends a notification to the target owner. |
| Like / View / Follow | Unchanged logic. |
| Notice | **New module**: `getNotices`, `getNotice`, admin CRUD (`createNotice`, `updateNotice`, `removeNotice`, `getAllNoticesByAdmin`). |
| Notification | **New module**: `getMyNotifications`, `readNotification`, `readAllNotifications`, admin list/remove; helper `notifyTarget()` used by other services. |
| Report | **New module + schema**: members report a member / product / article (`ReportGroup`, `ReportReason`, `ReportStatus`); admin resolves/rejects. |
| Message | **New module + schema**: private 1-to-1 messages (`sendMessage`, `getConversations`, `getMessages`, `markConversationRead`), pushed live through `SocketGateway.emitToMembers`. |
| Cart | **New module**: `getMyCart`, `getCartCount`, `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart`. |
| Order | **New module**: one order per seller per checkout, stock reservation, status flow, cron expiry of unpaid orders every 5 min. |
| Payment | **New module**: `PaymentGateway` stub (test mode, approves every charge), `getMyPayments`, `getAllPaymentsByAdmin`. |
| Socket | Rewritten gateway: message ids, timestamps, read receipts (`readPublic` → `publicRead`), 10-message history, per-member socket map, `emitToMembers`, `isOnline`, safe token parsing, 500-char limit; module now exports the gateway. |
| Batch | Unchanged (rank = likes × 2 + views for products; same agent formula). |
| App module | `ScheduleModule.forRoot()` added; GraphQL `formatError` always returns a plain string (`readableErrorMessage`). |

## GraphQL Changes

Renamed operations (breaking for Nestar clients):

| Nestar | Furniture |
| --- | --- |
| `createProperty`, `updateProperty`, `getProperty`, `getProperties` | `createProduct`, `updateProduct`, `getProduct`, `getProducts` |
| `getAgentProperties`, `likeTargetProperty` | `getAgentProducts`, `likeTargetProduct` |
| `getAllPropertiesByAdmin`, `updatePropertyByAdmin`, `removePropertyByAdmin` | `getAllProductsByAdmin`, `updateProductByAdmin`, `removeProductByAdmin` |
| Types `Property`, `Properties`, `PropertyInput`, `PropertyUpdate`, `PropertiesInquiry`, `AgentPropertiesInquiry` | `Product`, `Products`, `ProductInput`, `ProductUpdate`, `ProductsInquiry`, `AgentProductsInquiry` |
| Enums `PropertyType`, `PropertyStatus`, `PropertyLocation` | `ProductType`, `ProductStatus`, `ProductLocation` |

New operations:

| Module | Queries | Mutations |
| --- | --- | --- |
| Cart | `getMyCart`, `getCartCount` | `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart` |
| Order | `getMyOrders`, `getOrder`, `getSellerOrders` (AGENT), `getAllOrdersByAdmin` (ADMIN) | `createOrders`, `payOrders`, `cancelOrder`, `updateOrderStatusBySeller` (AGENT), `updateOrderByAdmin` (ADMIN) |
| Payment | `getMyPayments`, `getAllPaymentsByAdmin` (ADMIN) | — |
| Message | `getConversations`, `getMessages` | `sendMessage`, `markConversationRead` |
| Notice | `getNotices`, `getNotice`, `getAllNoticesByAdmin` (ADMIN) | `createNotice`, `updateNotice`, `removeNotice` (ADMIN) |
| Notification | `getMyNotifications`, `getAllNotificationsByAdmin` (ADMIN) | `readNotification`, `readAllNotifications`, `removeNotificationByAdmin` (ADMIN) |
| Report | `getMyReports`, `getAllReportsByAdmin` (ADMIN) | `createReport`, `updateReportByAdmin` (ADMIN) |

Field changes on `Product`: `productStock: Int!` added; `productRent` removed. Input `productStock` is optional, `1..999`.

## MongoDB Collection and Schema Changes

| Data Layer Item | Change |
| --- | --- |
| `properties` | Renamed to `products` (no data migration script exists in the repo). |
| `Product.productStock` | New, `default: 1, min: 0`; old documents backfilled to `1` on API start. |
| `Product.productRent` | Removed. |
| Product unique index | Same as Nestar: `{ productType, productLocation, productTitle, productPrice }` unique. |
| `Member.memberProperties` | Renamed to `memberProducts`. |
| `notifications` | Now written; new fields `orderId`, `orderStatus`. |
| `notices` | Now used by the notice module. |
| `cartItems` (new) | `memberId`, `productId`, `quantity`; unique `(memberId, productId)`. |
| `orders` (new) | Recipient/address copy, `orderStatus`, subtotal/delivery/total, `memberId` (buyer), `agentId` (seller), `paymentId`, status timestamps; 3 indexes incl. expiry index. |
| `orderItems` (new) | Snapshot of `itemPrice`, `productTitle`, `productImage`, `itemQuantity`. |
| `payments` (new) | `paymentMethod` (`CARD`, `KAKAO_PAY`, `TOSS_PAY`, `BANK_TRANSFER`), `paymentStatus` (`PAID`, `PARTIAL_REFUNDED`, `REFUNDED`), amounts, unique `transactionKey`, `orderIds`. |
| `messages` (new) | `conversationKey`, `senderId`, `receiverId`, `messageText`, `messageStatus` (`SENT`, `READ`). |
| `reports` (new) | `reportGroup`, `reportReason`, `reportStatus`, `reportDesc`, `reportRefId`, `memberId`; unique `(memberId, reportRefId)`. |
| Database name | `.env.example` uses `/furniture` instead of `/Nestar`. |

## Order Rules (`libs/config.ts` → `ORDER_RULES`)

| Rule | Value |
| --- | --- |
| `MAX_CART_QUANTITY` | 10 pieces of one product |
| `DELIVERY_FEE` | 50 per seller order |
| `FREE_DELIVERY_FROM` | 1000 (subtotal) |
| `PENDING_TTL_MINUTES` | 30 — unpaid orders are cancelled and stock released |

Status flow (`ORDER_STATUS_FLOW`): `PENDING → PAID → PROCESSING → SHIPPED → DELIVERED`, `CANCELLED` from `PENDING`/`PAID`/`PROCESSING`. Buyer may cancel only in `PENDING`/`PAID`. `PENDING → PAID` only through `payOrders`.

## Compatibility Notes

- Nestar clients (including unchanged `nestar-next`) **cannot** talk to the Furniture API: every `Property` operation and type was renamed.
- Existing Nestar data is not readable by Furniture without renaming the `properties` collection, all `property*` fields and `memberProperties`.
- The frontend copy of `ORDER_RULES` (`furniture-next/libs/config.ts`) must be kept identical to the backend.
- Real payments are not implemented: `payment.gateway.ts` is a stub (see `docs/orders.md`).
- Public chat history and read receipts live in memory: they reset on every API restart.
