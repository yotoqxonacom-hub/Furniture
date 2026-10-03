import { Schema } from 'mongoose';
import { OrderStatus } from '../libs/enums/order.enum';
import { NotificationGroup, NotificationStatus, NotificationType } from '../libs/enums/notification.enum';

const NotificationSchema = new Schema(
	{
		notificationType: {
			type: String,
			enum: NotificationType,
			required: true,
		},

		notificationStatus: {
			type: String,
			enum: NotificationStatus,
			default: NotificationStatus.WAIT,
		},

		notificationGroup: {
			type: String,
			enum: NotificationGroup,
			required: true,
		},

		notificationTitle: {
			type: String,
			required: true,
		},

		notificationDesc: {
			type: String,
		},

		authorId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		receiverId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		productId: {
			type: Schema.Types.ObjectId,
			ref: 'Product',
		},

		articleId: {
			type: Schema.Types.ObjectId,
			ref: 'BoardArticle',
		},

		orderId: {
			type: Schema.Types.ObjectId,
			ref: 'Order',
		},

		orderStatus: {
			type: String,
			enum: OrderStatus,
		},
	},
	{ timestamps: true, collection: 'notifications' },
);

export default NotificationSchema;
