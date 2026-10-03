import { Schema } from 'mongoose';
import { MessageStatus } from '../libs/enums/message.enum';

/** Private (1:1) message between two members */
const MessageSchema = new Schema(
	{
		/** sorted "memberA_memberB" — identifies the conversation */
		conversationKey: {
			type: String,
			required: true,
		},

		senderId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		receiverId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		messageText: {
			type: String,
			required: true,
		},

		messageStatus: {
			type: String,
			enum: MessageStatus,
			default: MessageStatus.SENT,
		},
	},
	{ timestamps: true, collection: 'messages' },
);

MessageSchema.index({ conversationKey: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, messageStatus: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });

export default MessageSchema;
