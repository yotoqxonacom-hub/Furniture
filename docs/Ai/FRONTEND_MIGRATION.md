# Frontend Migration: Nestar-next to Furniture-next

> **Location:** this folder exists only in the backend repo (`yotoqxonacom-hub/Furniture/docs/Ai`). It is the single record for **both** the backend and the frontend (`furniture-next`); the frontend repo has no copy and links here.

Compared revisions (read-only analysis, nothing was pushed):

| Repo | Branch | Commit | Date |
| --- | --- | --- | --- |
| `yotoqxonacom-hub/Nestar-next` | `develop` | `4937b72` "fix: modify WebSoket final stage logic" | 2026-10-02 |
| `yotoqxonacom-hub/furniture-next` | `develop` | `09d212f` "feat: make homepage top sellers an autoplay carousel (right to left)" | 2026-10-04 |

Diff size after normalising names (`property → product`, `nestar → furniture`): 71 files changed, 62 files only in Furniture, 30 files only in Nestar, ~17 000 diff lines.
Furniture-next is a **redesign**, not just a rename.

## Goal (as implemented)

- Rebrand Nestar (real estate) to Furniture (furniture marketplace) with a new warm visual identity.
- Talk to the renamed Furniture backend (`Product` operations) — no compatibility aliases, operations were renamed directly.
- One responsive markup for every page instead of separate PC / mobile trees.
- Add commerce (cart, checkout, orders), private chat, notifications, reports, help center and a bigger admin panel.
- Add Uzbek as a fourth language and make all UI text translatable.

## Project Identity and Tooling

| Area | Nestar-next | Furniture-next |
| --- | --- | --- |
| Package | `nestar-next` 2.2.0 | `furniture-next` 1.0.0 |
| Framework | Next.js 14.2 (pages router), React 18.2, MUI 5, Apollo Client 3 | same |
| Scripts | dev, build, start, lint, changelog | + `i18n:check` (`node scripts/i18n-keys.js`) |
| Prettier | printWidth 120, tabs, single quotes | same |
| Env | `process.env.REACT_APP_*` read directly | `libs/env.ts` with fallbacks + `.env.example` (`REACT_APP_API_URL`, `REACT_APP_API_GRAPHQL_URL`, `REACT_APP_API_WS`, default port 3007) |
| README | Generic | Full feature list, folder map, translation guide |

Dependencies removed in Furniture (no longer used): `three`, `@react-three/fiber`, `@react-three/drei`, `@pmndrs/branding`, `valtio`, `chart.js`, `react-slick`, `slick-carousel`, `react-spring`, `react-icons`, `react-cookie`, `notistack`, `nouislider-react`, `material-ui-pickers`, `material-ui-popup-state`, `@mui/styles`, `@mui/x-date-pickers-pro`, `@date-io/date-fns`, `date-fns`, `browser-image-compression`, `react-telegram-auth`, `react-tree`, `react-scripts`, `view`, `@cahil/utils`. No new runtime dependencies were added.

## Styling and Layout

| Area | Nestar-next | Furniture-next |
| --- | --- | --- |
| SCSS structure | `scss/pc/**` + `scss/mobile/**` (per page) | `scss/furniture/*.scss` (home, products, agents, community, cs, mypage, orders, chat, pages) + `scss/admin/admin.scss` |
| Device handling | `useDeviceDetect` by user agent; components branch PC vs mobile | Responsive CSS (breakpoints 1100 / 900 / 600 px); `useDeviceDetect` now viewport-based, kept for the desktop-only admin |
| MUI theme | bg `#f4f6f8`, primary `#E92C28`, secondary `#1646C1` | bg `#FAF7F2`, primary `#B8653E`, secondary `#5F6E51`, radius 12, font Manrope; multiline inputs no longer forced to 48 px |
| Layouts | `LayoutBasic`, `LayoutHome`, `LayoutFull`, `LayoutAdmin` | same files rewritten + new `layout/Shell.tsx` |
| `_app.tsx` | imports `pc/main.scss`, `mobile/main.scss` | imports `furniture/index.scss`, `admin/admin.scss`; `useScrollRestoration` keeps scroll position on Back |
| Images | `public/img`, `public/video` | `public/img/pages/*` (page header photos mapped in `libs/pageImages.ts`), `public/img/furniture/*` hand-made SVGs |

## Page Mapping

| Nestar-next page | Furniture-next page | Notes |
| --- | --- | --- |
| `/` | `/` | New home: `HomeHero`, `Categories`, `Collections`, `ProductSection`, `Promo`, `Perks`, `HomeVideo`, `HomeFaq`, `TopAgents` (autoplay carousel), `CommunityBoards`. |
| `/property`, `/property/detail` | `/product`, `/product/detail` | Shop with filter drawer; detail with gallery, reviews, similar pieces, add-to-cart, report, seller follow. |
| `/agent`, `/agent/detail` | same routes | "Sellers"; agent sees own card ("You") and `MyShopPanel`; Message button opens private chat. |
| `/community`, `/community/detail` | same routes | Tabs from `communityTabs` (FREE, INTERIOR, RECOMMEND, NEWS); author follow button. |
| `/cs` | `/cs` | Help center: notices, searchable FAQ, terms — loaded from backend notice module. |
| `/mypage` | `/mypage` | + My orders, My reports, seller orders, `ListingCard`. |
| `/member` | `/member` | `MemberHeader`, `MemberFollows` (merged followers/followings). |
| `/account/join`, `/about` | same | Restyled. |
| — | `/cart` | **New**. |
| — | `/order/checkout`, `/order/detail` | **New**. |
| `/_admin`, users, community, cs/faq, cs/notice | same | Reworked; FAQ/notice CRUD via `NoticeManager`. |
| `/_admin/properties` | `/_admin/products` | Renamed. |
| `/_admin/cs/inquiry` | removed | Inquiry handled through notices (`libs/admin/inquiry.ts`). |
| — | `/_admin/orders`, `/_admin/reports`, `/_admin/cs/notification` | **New**. |

## Components

| Change | Components |
| --- | --- |
| Removed | `FiberContainer`, `ScrollControls` (3D), `PropertyBigCard`, `Advertisement`, `Events`, `HeaderFilter`, `PopularProperties(+Card)`, `TopProperties(+Card)`, `TrendProperties(+Card)`, `TopAgentCard`, homepage `CommunityCard`, `ReviewCard`, `Review`, `property/PropertyCard`, `mypage/PropertyCard`, `mypage/Article`, `MemberMenu`, `MemberArticles`, `MemberFollowers`, `MemberFollowings`, `cs/Inquiry`, admin `FaqList`/`InquiryList`/`NoticeList` |
| Added (common) | `ProductCard`, `CartButton`, `QuantityStepper`, `FollowButton`, `AddProductButton` (renders only for agents), `ReportModal` |
| Added (other) | `agent/MyShopPanel`, `mypage/ListingCard`, `MyOrders`, `MyReports`, `member/MemberHeader`, `MemberFollows`, `order/*`, `admin/orders/*`, `admin/cs/NoticeManager`, `cs/FaqList`, homepage sections listed above |
| Heavily rewritten | `Top.tsx` (header: cart badge, notifications bell, drawer menu), `Chat.tsx` (inbox + public tabs), `Footer.tsx`, `product/Filter.tsx`, `mypage/AddNewProduct.tsx`, `mypage/MyMenu.tsx`, `community/Teditor.tsx` |

## New Libraries and Hooks

| File | Purpose |
| --- | --- |
| `libs/env.ts` | Backend URLs with safe defaults. |
| `libs/socket.ts` | One shared WebSocket per tab, auto-reconnect with back-off, events → Apollo reactive vars. |
| `libs/chat.ts` | `openChatWith` and chat helpers. |
| `libs/member.ts` | Role helpers: `isAgent`, `isSameMember`, `profileHref`, `ADD_PRODUCT_HREF`. |
| `libs/errorMessage.ts` | `errorMessageOf()` — always a readable string. |
| `libs/i18n.ts` | `translate()` for non-React code, `intlLocale()` for dates. |
| `libs/upload.ts`, `libs/productFilter.ts`, `libs/pageImages.ts`, `libs/data/defaultFaqs.ts`, `libs/admin/inquiry.ts` | Upload, filter state, page photos, FAQ fallback, inquiry helpers. |
| Hooks | `useCart`, `useOrderActions`, `useFollowActions`, `useLikeProduct`, `useLikeMember`, `useFaqs`, `useScrollRestoration` |
| Types / enums | `libs/types/{cart,order,payment,message,notice,notification,report}`, `libs/enums/{order,payment,report}.enum.ts`; `productTypeLabel` map |

## Apollo / GraphQL Changes

| Area | Nestar-next | Furniture-next |
| --- | --- | --- |
| WebSocket | `WebSocketLink` + `LoggingWebSocket` inside `apollo/client.ts`, `socketVar` | Removed from Apollo; `libs/socket.ts` + reactive vars (`socketStatusVar`, `onlineUsersVar`, `publicMessagesVar`, `socketEventVar`, `chatOpenVar`, `chatTabVar`, `chatTargetVar`, `unreadMessagesVar`) |
| Errors | Every GraphQL error showed an alert | Mutations: caller shows one alert; queries: alert unless `context.silent` |
| Store | `socketVar` | + `cartCountVar` (header badge) |

Renamed documents: `GET_PROPERTY`, `GET_PROPERTIES`, `GET_AGENT_PROPERTIES`, `CREATE_PROPERTY`, `UPDATE_PROPERTY`, `LIKE_TARGET_PROPERTY`, `GET_ALL_PROPERTIES_BY_ADMIN`, `UPDATE_PROPERTY_BY_ADMIN`, `REMOVE_PROPERTY_BY_ADMIN` → `*_PRODUCT*` equivalents.

New documents:

| File | Added |
| --- | --- |
| `apollo/user/query.ts` | `GET_NOTICES`, `GET_FAQS`, `GET_MY_NOTIFICATIONS`, `GET_MY_REPORTS`, `GET_CONVERSATIONS`, `GET_MESSAGES`, `GET_CART_COUNT`, `GET_MY_CART`, `GET_MY_ORDERS`, `GET_SELLER_ORDERS`, `GET_ORDER` |
| `apollo/user/mutation.ts` | `READ_NOTIFICATION`, `READ_ALL_NOTIFICATIONS`, `CREATE_REPORT`, `SEND_MESSAGE`, `MARK_CONVERSATION_READ`, `ADD_TO_CART`, `UPDATE_CART_ITEM`, `REMOVE_CART_ITEM`, `CLEAR_CART`, `CREATE_ORDERS`, `PAY_ORDERS`, `CANCEL_ORDER`, `UPDATE_ORDER_STATUS_BY_SELLER` |
| `apollo/admin/query.ts` | `GET_ALL_NOTICES_BY_ADMIN`, `GET_ALL_NOTIFICATIONS_BY_ADMIN`, `GET_ALL_REPORTS_BY_ADMIN`, `GET_ALL_ORDERS_BY_ADMIN` |
| `apollo/admin/mutation.ts` | `CREATE_NOTICE`, `UPDATE_NOTICE`, `REMOVE_NOTICE`, `REMOVE_NOTIFICATION_BY_ADMIN`, `UPDATE_REPORT_BY_ADMIN`, `UPDATE_ORDER_BY_ADMIN` |

## UI Terminology and Field Mapping

| Backend field / term | Nestar meaning | Furniture UI label |
| --- | --- | --- |
| Brand | Nestar | Furniture |
| `Property` / `Product` | Property listing | Product / piece |
| `MemberType.AGENT` | Real-estate agent | Seller (code keeps `agent` names and routes) |
| `productType` | Apartment / Villa / House | Sofa, Corner sofa, Armchair, Bed, Pouf, Mattress, Kids (`productTypeLabel`) |
| `productLocation` | Property location | City |
| `productSquare` | Floor area | Size (cm) |
| `productBeds` | Bedrooms | Seats |
| `productRooms` | Rooms | Pieces in set |
| `constructedAt` | Construction date | Year made |
| `productRent` | Rent | removed |
| `productBarter` | Barter | Barter (kept) |
| `productStock` | — | In stock (pcs) |
| `BoardArticleCategory.HUMOR` | Humor | replaced by Interior |

## Internationalisation

| Area | Nestar-next | Furniture-next |
| --- | --- | --- |
| Locales | `en`, `kr`, `ru` | `en`, `kr`, `uz`, `ru` |
| Keys | Nested keys | English sentence is the key; `nsSeparator: false`, `keySeparator: false` |
| Coverage | — | 582 keys in each `public/locales/*/common.json`; `yarn i18n:check` fails on missing keys |

## Config Shared With Backend

`libs/config.ts` now contains `ORDER_RULES` + `deliveryFeeFor()` (must match backend), `communityTabs`, `CONTACTS` (phone, email, Instagram, Telegram, placeholder Facebook link) and `telHref()`. `availableOptions` lost `productRent`.

## Compatibility Rules

- Furniture-next works only with the Furniture backend `develop` branch (cart/order/payment). Its README still names `feature/notice-notification` — update it.
- Keep `ORDER_RULES` identical in `furniture-next/libs/config.ts` and `Furniture/apps/furniture-api/src/libs/config.ts`.
- Every new UI string needs entries in all four locale files.
- Admin panel is desktop-only; all other pages must stay responsive.
