import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, ObjectId } from 'mongoose';
import { Order, OrderItem, Orders } from '../../libs/dto/order/order';
import {
	AllOrdersInquiry,
	OrderInput,
	OrdersInquiry,
	OrderStatusInput,
	ShippingAddressInput,
} from '../../libs/dto/order/order.input';
import { Payment } from '../../libs/dto/payment/payment';
import { PaymentInput } from '../../libs/dto/payment/payment.input';
import { Product } from '../../libs/dto/product/product';
import { Member } from '../../libs/dto/member/member';
import { BUYER_CANCELLABLE, ORDER_STATUS_FLOW, OrderStatus } from '../../libs/enums/order.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import {
	deliveryFeeFor,
	lookupAgent,
	lookupMember,
	lookupOrderItems,
	ORDER_RULES,
	shapeIntoMongoObjectId,
} from '../../libs/config';
import { T } from '../../libs/types/common';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { PaymentService } from '../payment/payment.service';
import { NotificationService } from '../notification/notification.service';

interface CheckoutLine {
	product: Product;
	quantity: number;
}

/** which date field records each status */
const STATUS_DATE: Partial<Record<OrderStatus, string>> = {
	[OrderStatus.PAID]: 'paidAt',
	[OrderStatus.PROCESSING]: 'processedAt',
	[OrderStatus.SHIPPED]: 'shippedAt',
	[OrderStatus.DELIVERED]: 'deliveredAt',
	[OrderStatus.CANCELLED]: 'cancelledAt',
};

@Injectable()
export class OrderService {
	constructor(
		@InjectModel('Order') private readonly orderModel: Model<Order>,
		@InjectModel('OrderItem') private readonly orderItemModel: Model<OrderItem>,
		@InjectModel('Product') private readonly productModel: Model<Product>,
		private readonly cartService: CartService,
		private readonly productService: ProductService,
		private readonly paymentService: PaymentService,
		private readonly notificationService: NotificationService,
	) {}

	/** BUYER */

	/**
	 * Cart -> orders. Stock is reserved now, one order is created per seller,
	 * and the bought products leave the cart. Orders stay PENDING until payOrders.
	 */
	public async createOrders(memberId: ObjectId, input: OrderInput): Promise<Order[]> {
		const lines = await this.checkoutLines(memberId, input.productIds?.map(shapeIntoMongoObjectId));

		const reserved: CheckoutLine[] = [];
		for (const line of lines) {
			const ok = await this.productService.reserveStock(line.product._id, line.quantity);
			if (!ok) {
				await this.releaseLines(reserved);
				throw new BadRequestException(`${Message.OUT_OF_STOCK} (${line.product.productTitle})`);
			}
			reserved.push(line);
		}

		const created: Order[] = [];
		try {
			for (const [agentId, sellerLines] of this.groupBySeller(lines)) {
				created.push(await this.createSellerOrder(memberId, agentId, sellerLines, input.shippingAddress));
			}
			await this.cartService.removeItems(
				memberId,
				lines.map((line) => line.product._id),
			);
			return created;
		} catch (err) {
			console.log('Error, createOrders:', err instanceof Error ? err.message : err);
			const ids = created.map((order) => order._id);
			await this.orderItemModel.deleteMany({ orderId: { $in: ids } }).exec();
			await this.orderModel.deleteMany({ _id: { $in: ids } }).exec();
			await this.releaseLines(reserved);
			throw new InternalServerErrorException(Message.CREATE_FAILED);
		}
	}

	/** Pays the buyer's PENDING orders with one payment */
	public async payOrders(memberId: ObjectId, input: PaymentInput): Promise<Payment> {
		const orderIds = [...new Set(input.orderIds)].map(shapeIntoMongoObjectId);
		const orders = await this.orderModel
			.find({ _id: { $in: orderIds }, memberId, orderStatus: OrderStatus.PENDING })
			.lean<Order[]>()
			.exec();
		if (orders.length !== orderIds.length) throw new BadRequestException(Message.ORDER_NOT_PAYABLE);

		const payment = await this.paymentService.charge({
			memberId,
			orderIds,
			paymentAmount: orders.reduce((sum, order) => sum + order.orderTotal, 0),
			paymentMethod: input.paymentMethod,
		});

		// only orders that are still PENDING are marked paid (one may have expired meanwhile)
		await this.orderModel
			.updateMany(
				{ _id: { $in: orderIds }, orderStatus: OrderStatus.PENDING },
				{ orderStatus: OrderStatus.PAID, paymentId: payment._id, paidAt: payment.paidAt },
			)
			.exec();
		const paidIds = new Set(
			(await this.orderModel.find({ _id: { $in: orderIds }, paymentId: payment._id }).select('_id').lean<T[]>().exec()).map(
				(order) => String(order._id),
			),
		);
		const missed = orders.filter((order) => !paidIds.has(String(order._id)));
		for (const order of missed) await this.paymentService.refund(payment._id, order.orderTotal);

		const summaries = await this.summaries(orderIds);
		for (const order of orders.filter((order) => paidIds.has(String(order._id)))) {
			await this.notificationService.notifyOrder({
				authorId: memberId,
				receiverId: order.agentId,
				orderId: order._id,
				orderStatus: OrderStatus.PAID,
				summary: summaries.get(String(order._id)) ?? '',
			});
		}
		return payment;
	}

	public async cancelMyOrder(memberId: ObjectId, orderId: ObjectId, cancelReason?: string): Promise<Order> {
		const order = await this.orderModel.findOne({ _id: orderId, memberId }).lean<Order>().exec();
		if (!order) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (!BUYER_CANCELLABLE.includes(order.orderStatus)) throw new BadRequestException(Message.ORDER_STATUS_DENIED);
		return await this.changeStatus(order, OrderStatus.CANCELLED, memberId, cancelReason);
	}

	public async getMyOrders(memberId: ObjectId, input: OrdersInquiry): Promise<Orders> {
		const match: T = { memberId };
		if (input.search?.orderStatus) match.orderStatus = input.search.orderStatus;
		return await this.aggregateOrders(match, input, { agent: true });
	}

	/** buyer, seller of the order or an admin */
	public async getOrder(member: Member, orderId: ObjectId): Promise<Order> {
		const match: T = { _id: orderId };
		if (member.memberType !== MemberType.ADMIN) match.$or = [{ memberId: member._id }, { agentId: member._id }];

		const result = await this.aggregateOrders(match, { page: 1, limit: 1 }, { agent: true, member: true });
		if (!result.list.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result.list[0];
	}

	/** SELLER */

	/** unpaid orders are hidden from sellers: nothing to do until the buyer pays */
	public async getSellerOrders(agentId: ObjectId, input: OrdersInquiry): Promise<Orders> {
		const { orderStatus } = input.search ?? {};
		if (orderStatus === OrderStatus.PENDING) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = { agentId, orderStatus: orderStatus ?? { $ne: OrderStatus.PENDING } };
		return await this.aggregateOrders(match, input, { member: true });
	}

	public async updateOrderStatusBySeller(agentId: ObjectId, input: OrderStatusInput): Promise<Order> {
		const order = await this.orderModel
			.findOne({ _id: shapeIntoMongoObjectId(input.orderId), agentId })
			.lean<Order>()
			.exec();
		if (!order) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return await this.changeStatus(order, input.orderStatus, agentId, input.cancelReason);
	}

	/** ADMIN */

	public async getAllOrdersByAdmin(input: AllOrdersInquiry): Promise<Orders> {
		const { orderStatus, agentId, memberId } = input.search ?? {};
		const match: T = {};
		if (orderStatus) match.orderStatus = orderStatus;
		if (agentId) match.agentId = shapeIntoMongoObjectId(agentId);
		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		return await this.aggregateOrders(match, input, { agent: true, member: true });
	}

	public async updateOrderByAdmin(adminId: ObjectId, input: OrderStatusInput): Promise<Order> {
		const order = await this.orderModel.findById(shapeIntoMongoObjectId(input.orderId)).lean<Order>().exec();
		if (!order) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return await this.changeStatus(order, input.orderStatus, adminId, input.cancelReason);
	}

	/** SYSTEM */

	/** unpaid orders give their stock back after ORDER_RULES.PENDING_TTL_MINUTES */
	@Cron(CronExpression.EVERY_5_MINUTES)
	public async expirePendingOrders(): Promise<void> {
		const limit = new Date(Date.now() - ORDER_RULES.PENDING_TTL_MINUTES * 60 * 1000);
		const expired = await this.orderModel
			.find({ orderStatus: OrderStatus.PENDING, createdAt: { $lt: limit } })
			.lean<Order[]>()
			.exec();
		for (const order of expired) {
			try {
				await this.changeStatus(order, OrderStatus.CANCELLED, null, 'Payment time expired');
			} catch (err) {
				console.log('Error, expirePendingOrders:', err instanceof Error ? err.message : err);
			}
		}
	}

	/** HELPERS */

	/** validates the cart rows that go to checkout */
	private async checkoutLines(memberId: ObjectId, productIds?: ObjectId[]): Promise<CheckoutLine[]> {
		const cartItems = await this.cartService.getItemsForCheckout(memberId, productIds);
		if (!cartItems.length) throw new BadRequestException(Message.CART_EMPTY);

		const products = await this.productModel
			.find({ _id: { $in: cartItems.map((item) => item.productId) } })
			.lean<Product[]>()
			.exec();
		const productById = new Map<string, Product>(products.map((product: Product) => [String(product._id), product]));

		return cartItems.map((item) => {
			const product = productById.get(String(item.productId));
			if (!product || product.productStatus !== ProductStatus.ACTIVE)
				throw new BadRequestException(Message.PRODUCT_NOT_AVAILABLE);
			if (String(product.memberId) === String(memberId)) throw new BadRequestException(Message.OWN_PRODUCT);
			if (item.quantity > product.productStock)
				throw new BadRequestException(`${Message.OUT_OF_STOCK} (${product.productTitle})`);
			return { product, quantity: item.quantity };
		});
	}

	private groupBySeller(lines: CheckoutLine[]): Map<string, CheckoutLine[]> {
		const groups = new Map<string, CheckoutLine[]>();
		for (const line of lines) {
			const key = String(line.product.memberId);
			groups.set(key, [...(groups.get(key) ?? []), line]);
		}
		return groups;
	}

	private async createSellerOrder(
		memberId: ObjectId,
		agentId: string,
		lines: CheckoutLine[],
		shippingAddress: ShippingAddressInput,
	): Promise<Order> {
		const orderSubtotal = lines.reduce((sum, line) => sum + line.product.productPrice * line.quantity, 0);
		const orderDeliveryFee = deliveryFeeFor(orderSubtotal);

		const order = await this.orderModel.create({
			memberId,
			agentId: shapeIntoMongoObjectId(agentId),
			orderSubtotal,
			orderDeliveryFee,
			orderTotal: orderSubtotal + orderDeliveryFee,
			shippingAddress,
		});
		const orderItems = await this.orderItemModel.insertMany(
			lines.map((line) => ({
				orderId: order._id,
				productId: line.product._id,
				itemQuantity: line.quantity,
				itemPrice: line.product.productPrice,
				productTitle: line.product.productTitle,
				productImage: line.product.productImages?.[0],
			})),
		);
		return { ...order.toObject(), orderItems };
	}

	/** the single place where an order changes status */
	private async changeStatus(
		order: Order,
		next: OrderStatus,
		actorId: ObjectId | null,
		cancelReason?: string,
	): Promise<Order> {
		if (!ORDER_STATUS_FLOW[order.orderStatus].includes(next)) throw new BadRequestException(Message.ORDER_STATUS_DENIED);

		const update: T = { orderStatus: next };
		const dateField = STATUS_DATE[next];
		if (dateField) update[dateField] = new Date();
		if (next === OrderStatus.CANCELLED && cancelReason) update.cancelReason = cancelReason;

		// the status must still be the one we checked (no double cancel / double refund)
		const result = await this.orderModel
			.findOneAndUpdate({ _id: order._id, orderStatus: order.orderStatus }, update, { new: true })
			.exec();
		if (!result) throw new BadRequestException(Message.ORDER_STATUS_DENIED);

		if (next === OrderStatus.CANCELLED) {
			const items = await this.orderItemModel.find({ orderId: order._id }).lean<OrderItem[]>().exec();
			for (const item of items) await this.productService.releaseStock(item.productId, item.itemQuantity);
			if (order.paymentId) await this.paymentService.refund(order.paymentId, order.orderTotal);
		}

		if (actorId) {
			const summary = (await this.summaries([order._id])).get(String(order._id)) ?? '';
			for (const receiverId of [order.memberId, order.agentId]) {
				await this.notificationService.notifyOrder({
					authorId: actorId,
					receiverId,
					orderId: order._id,
					orderStatus: next,
					summary,
				});
			}
		}
		return result;
	}

	private async releaseLines(lines: CheckoutLine[]): Promise<void> {
		for (const line of lines) await this.productService.releaseStock(line.product._id, line.quantity);
	}

	/** "Oslo sofa", "Oslo sofa +2 more" per order id, for notifications */
	private async summaries(orderIds: ObjectId[]): Promise<Map<string, string>> {
		const items = await this.orderItemModel
			.find({ orderId: { $in: orderIds } })
			.sort({ createdAt: 1 })
			.lean<OrderItem[]>()
			.exec();
		const byOrder = new Map<string, string[]>();
		for (const item of items) {
			const key = String(item.orderId);
			byOrder.set(key, [...(byOrder.get(key) ?? []), item.productTitle]);
		}
		return new Map(
			[...byOrder].map(([key, titles]) => [key, titles.length > 1 ? `${titles[0]} +${titles.length - 1} more` : titles[0]]),
		);
	}

	private async aggregateOrders(
		match: T,
		input: { page: number; limit: number; sort?: string; direction?: Direction },
		join: { agent?: boolean; member?: boolean },
	): Promise<Orders> {
		const sort: T = { [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC };
		const list: T[] = [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }, lookupOrderItems];
		if (join.agent) list.push(lookupAgent, { $unwind: { path: '$agentData', preserveNullAndEmptyArrays: true } });
		if (join.member) list.push(lookupMember, { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } });

		const result: Orders[] = await this.orderModel
			.aggregate([{ $match: match }, { $sort: sort }, { $facet: { list, metaCounter: [{ $count: 'total' }] } }])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}
}
