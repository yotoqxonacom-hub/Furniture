import { Schema } from 'mongoose';

/** price, title and image are snapshots taken at checkout time */
const OrderItemSchema = new Schema(
	{
		orderId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Order',
		},

		productId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Product',
		},

		itemQuantity: {
			type: Number,
			required: true,
			min: 1,
		},

		itemPrice: {
			type: Number,
			required: true,
		},

		productTitle: {
			type: String,
			required: true,
		},

		productImage: {
			type: String,
		},
	},
	{ timestamps: true, collection: 'orderItems' },
);

OrderItemSchema.index({ orderId: 1 });

export default OrderItemSchema;
