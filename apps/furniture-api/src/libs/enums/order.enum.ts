import { registerEnumType } from '@nestjs/graphql';

/**
 * PENDING    created from the cart, stock is reserved, waiting for payment
 * PAID       payment confirmed, waiting for the seller
 * PROCESSING seller is preparing the order
 * SHIPPED    handed to delivery
 * DELIVERED  received by the buyer (final)
 * CANCELLED  cancelled by buyer / seller / admin or expired unpaid (final)
 */
export enum OrderStatus {
	PENDING = 'PENDING',
	PAID = 'PAID',
	PROCESSING = 'PROCESSING',
	SHIPPED = 'SHIPPED',
	DELIVERED = 'DELIVERED',
	CANCELLED = 'CANCELLED',
}
registerEnumType(OrderStatus, {
	name: 'OrderStatus',
});

/** allowed manual status changes (PENDING -> PAID happens only through payment) */
export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
	[OrderStatus.PENDING]: [OrderStatus.CANCELLED],
	[OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
	[OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
	[OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
	[OrderStatus.DELIVERED]: [],
	[OrderStatus.CANCELLED]: [],
};

/** the buyer may cancel only before the seller starts working on the order */
export const BUYER_CANCELLABLE: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.PAID];
