# Cart, orders and payments

## Collections

| collection   | what it holds                                                                 |
|--------------|-------------------------------------------------------------------------------|
| `cartItems`  | one row per member + product (`quantity`), unique `(memberId, productId)`     |
| `orders`     | one order per **seller** per checkout; status, totals, shipping address copy  |
| `orderItems` | products of an order with **snapshots** of price, title and image             |
| `payments`   | one payment per checkout (can cover several seller orders), refunds tracked   |
| `products`   | new field `productStock` (old products are backfilled with `1` on start)      |

## Flow

1. `addToCart` / `updateCartItem` / `removeCartItem` — limits: product stock and `ORDER_RULES.MAX_CART_QUANTITY`.
2. `createOrders(input)` — validates the cart rows, **reserves stock atomically**
   (`productStock >= qty` in the same update), creates one `PENDING` order per seller and removes the rows from the cart.
   When stock reaches 0 the product becomes `SOLD`.
3. `payOrders({ orderIds, paymentMethod })` — one payment through `PaymentGateway`, orders become `PAID`,
   sellers get an `ORDER` notification.
4. Seller: `updateOrderStatusBySeller` → `PROCESSING` → `SHIPPED` → `DELIVERED` (rules in `ORDER_STATUS_FLOW`).
5. Cancel (buyer before `PROCESSING`, seller / admin before `SHIPPED`): stock is released, a paid order is refunded.
6. Unpaid orders are cancelled after `ORDER_RULES.PENDING_TTL_MINUTES` by a cron job (`@nestjs/schedule`).

Delivery fee: `ORDER_RULES.DELIVERY_FEE` per seller order, free from `ORDER_RULES.FREE_DELIVERY_FROM`.

## Payment provider

`components/payment/payment.gateway.ts` approves every charge locally (test mode).
To go live, implement `charge` and `refund` with Toss Payments or PortOne; nothing else changes.

## GraphQL

- Buyer: `getMyCart`, `getCartCount`, `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart`,
  `createOrders`, `payOrders`, `cancelOrder`, `getMyOrders`, `getOrder`, `getMyPayments`
- Seller (`AGENT`): `getSellerOrders`, `updateOrderStatusBySeller`
- Admin: `getAllOrdersByAdmin`, `updateOrderByAdmin`, `getAllPaymentsByAdmin`
