import { Schema } from 'mongoose';

/** one row per member + product; quantity is merged when the same product is added again */
const CartItemSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		productId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Product',
		},

		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
	},
	{ timestamps: true, collection: 'cartItems' },
);

CartItemSchema.index({ memberId: 1, productId: 1 }, { unique: true });

export default CartItemSchema;
