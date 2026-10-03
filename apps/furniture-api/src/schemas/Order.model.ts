import { Schema } from 'mongoose';
import { OrderStatus } from '../libs/enums/order.enum';
import { ProductLocation } from '../libs/enums/product.enum';

/** delivery address is copied into the order, so later profile changes don't rewrite history */
const ShippingAddressSchema = new Schema(
	{
		recipientName: { type: String, required: true },
		recipientPhone: { type: String, required: true },
		city: { type: String, enum: ProductLocation, required: true },
		address: { type: String, required: true },
		note: { type: String },
	},
	{ _id: false },
);

/** one order per seller: a checkout with products from two sellers creates two orders */
const OrderSchema = new Schema(
	{
		orderStatus: {
			type: String,
			enum: OrderStatus,
			default: OrderStatus.PENDING,
		},

		orderSubtotal: {
			type: Number,
			required: true,
		},

		orderDeliveryFee: {
			type: Number,
			default: 0,
		},

		orderTotal: {
			type: Number,
			required: true,
		},

		shippingAddress: {
			type: ShippingAddressSchema,
			required: true,
		},

		/** buyer */
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		/** seller */
		agentId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		paymentId: {
			type: Schema.Types.ObjectId,
			ref: 'Payment',
		},

		cancelReason: {
			type: String,
		},

		paidAt: { type: Date },
		processedAt: { type: Date },
		shippedAt: { type: Date },
		deliveredAt: { type: Date },
		cancelledAt: { type: Date },
	},
	{ timestamps: true, collection: 'orders' },
);

OrderSchema.index({ memberId: 1, createdAt: -1 });
OrderSchema.index({ agentId: 1, orderStatus: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1, createdAt: 1 }); // expiry job: PENDING + old

export default OrderSchema;
