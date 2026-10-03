import { Schema } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../libs/enums/payment.enum';

/** one payment can cover several seller orders created by the same checkout */
const PaymentSchema = new Schema(
	{
		paymentMethod: {
			type: String,
			enum: PaymentMethod,
			required: true,
		},

		paymentStatus: {
			type: String,
			enum: PaymentStatus,
			default: PaymentStatus.PAID,
		},

		paymentAmount: {
			type: Number,
			required: true,
		},

		refundedAmount: {
			type: Number,
			default: 0,
		},

		/** id returned by the payment provider */
		transactionKey: {
			type: String,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		orderIds: {
			type: [Schema.Types.ObjectId],
			required: true,
			ref: 'Order',
		},

		paidAt: { type: Date },
		refundedAt: { type: Date },
	},
	{ timestamps: true, collection: 'payments' },
);

PaymentSchema.index({ transactionKey: 1 }, { unique: true });
PaymentSchema.index({ memberId: 1, createdAt: -1 });

export default PaymentSchema;
