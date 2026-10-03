import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Conversation, Conversations, Message, Messages } from '../../libs/dto/message/message';
import { MessageInput, MessagesInquiry } from '../../libs/dto/message/message.input';
import { MessageStatus } from '../../libs/enums/message.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message as Msg } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { SocketGateway } from '../../socket/socket.gateway';

interface LeanMember {
	_id: ObjectId;
	memberStatus: MemberStatus;
	memberNick?: string;
	memberImage?: string;
	memberType?: string;
}

/** both members always get the same key, whoever writes first */
export const makeConversationKey = (a: ObjectId | string, b: ObjectId | string): string =>
	[String(a), String(b)].sort().join('_');

@Injectable()
export class MessageService {
	constructor(
		@InjectModel('Message') private readonly messageModel: Model<Message>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
		private readonly socketGateway: SocketGateway,
	) {}

	public async sendMessage(senderId: ObjectId, input: MessageInput): Promise<Message> {
		const receiverId = shapeIntoMongoObjectId(input.receiverId);
		if (String(receiverId) === String(senderId)) throw new BadRequestException(Msg.NOT_ALLOWED_REQUEST);

		const text = input.messageText.trim();
		if (!text) throw new BadRequestException(Msg.BAD_REQUEST);

		const [sender, receiver] = await Promise.all([
			this.memberModel.findById(senderId).select('memberStatus memberNick memberImage memberType').lean<LeanMember>().exec(),
			this.memberModel.findById(receiverId).select('memberStatus').lean<LeanMember>().exec(),
		]);
		if (!sender || sender.memberStatus !== MemberStatus.ACTIVE) throw new BadRequestException(Msg.BLOCKED_USER);
		if (!receiver || receiver.memberStatus !== MemberStatus.ACTIVE) throw new BadRequestException(Msg.NO_DATA_FOUND);

		let result: Message;
		try {
			result = await this.messageModel.create({
				conversationKey: makeConversationKey(senderId, receiverId),
				senderId,
				receiverId,
				messageText: text,
			});
		} catch (err) {
			console.log('Error, Service.model:', err instanceof Error ? err.message : err);
			throw new BadRequestException(Msg.CREATE_FAILED);
		}

		// live delivery to every open tab of both members
		this.socketGateway.emitToMembers([senderId, receiverId], {
			event: 'dm',
			message: {
				_id: String(result._id),
				conversationKey: result.conversationKey,
				senderId: String(senderId),
				receiverId: String(receiverId),
				messageText: result.messageText,
				messageStatus: result.messageStatus,
				createdAt: result.createdAt,
			},
			senderData: {
				_id: String(senderId),
				memberNick: sender.memberNick,
				memberImage: sender.memberImage,
				memberType: sender.memberType,
			},
		});

		return result;
	}

	public async getMessages(memberId: ObjectId, input: MessagesInquiry): Promise<Messages> {
		const partnerId = shapeIntoMongoObjectId(input.partnerId);
		const conversationKey = makeConversationKey(memberId, partnerId);

		const result: Messages[] = await this.messageModel
			.aggregate([
				{ $match: { conversationKey } },
				{ $sort: { createdAt: -1 } },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Msg.NO_DATA_FOUND);

		return result[0];
	}

	public async markConversationRead(memberId: ObjectId, partnerInput: string): Promise<number> {
		const partnerId = shapeIntoMongoObjectId(partnerInput);
		const result = await this.messageModel
			.updateMany(
				{
					conversationKey: makeConversationKey(memberId, partnerId),
					receiverId: memberId,
					messageStatus: MessageStatus.SENT,
				},
				{ messageStatus: MessageStatus.READ },
			)
			.exec();

		if (result.modifiedCount > 0) {
			// sender sees "Seen"; reader's other tabs clear their badge
			this.socketGateway.emitToMembers([partnerId, memberId], {
				event: 'read',
				readerId: String(memberId),
				partnerId: String(partnerId),
			});
		}
		return result.modifiedCount;
	}

	public async getConversations(memberInput: ObjectId): Promise<Conversations> {
		const memberId = shapeIntoMongoObjectId(memberInput);

		const list: T[] = await this.messageModel
			.aggregate([
				{ $match: { $or: [{ senderId: memberId }, { receiverId: memberId }] } },
				{ $sort: { createdAt: -1 } },
				{
					$group: {
						_id: '$conversationKey',
						lastMessage: { $first: '$$ROOT' },
						unreadCount: {
							$sum: {
								$cond: [
									{
										$and: [
											{ $eq: ['$receiverId', memberId] },
											{ $eq: ['$messageStatus', MessageStatus.SENT] },
										],
									},
									1,
									0,
								],
							},
						},
					},
				},
				{ $sort: { 'lastMessage.createdAt': -1 } },
				{ $limit: 50 },
				{
					$addFields: {
						conversationKey: '$_id',
						partnerId: {
							$cond: [{ $eq: ['$lastMessage.senderId', memberId] }, '$lastMessage.receiverId', '$lastMessage.senderId'],
						},
					},
				},
				{
					$lookup: {
						from: 'members',
						localField: 'partnerId',
						foreignField: '_id',
						as: 'partnerData',
					},
				},
				{ $unwind: { path: '$partnerData', preserveNullAndEmptyArrays: true } },
				{ $project: { 'partnerData.memberPassword': 0 } },
			])
			.exec();

		const conversations: Conversation[] = list.map((item) => ({
			...item,
			partnerOnline: this.socketGateway.isOnline(item.partnerId),
		})) as Conversation[];
		const totalUnread = conversations.reduce((sum, item) => sum + (item.unreadCount ?? 0), 0);

		return { list: conversations, totalUnread };
	}
}
