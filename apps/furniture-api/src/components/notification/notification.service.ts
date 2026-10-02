import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import {
	AllNotificationsInquiry,
	NotificationsInquiry,
	NotifyTargetInput,
} from '../../libs/dto/notification/notification.input';
import {
	NotificationGroup,
	NotificationStatus,
	NotificationType,
} from '../../libs/enums/notification.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { lookupAuthor, lookupReceiver } from '../../libs/config';

@Injectable()
export class NotificationService {
	constructor(
		@InjectModel('Notification') private readonly notificationModel: Model<Notification>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
		@InjectModel('Product') private readonly productModel: Model<any>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<any>,
	) {}

	/**
	 * Called from like / comment services.
	 * Never throws: a failed notification must not break the main action.
	 */
	public async notifyTarget(input: NotifyTargetInput): Promise<void> {
		try {
			const { notificationType, notificationGroup, authorId, refId } = input;
			const author = await this.memberModel.findById(authorId).select('memberNick').lean().exec();
			if (!author) return;

			const data: T = {
				notificationType,
				notificationGroup,
				authorId,
			};
			const action = notificationType === NotificationType.LIKE ? 'liked' : 'commented on';

			switch (notificationGroup) {
				case NotificationGroup.PRODUCT: {
					const product = await this.productModel.findById(refId).select('memberId productTitle').lean().exec();
					if (!product) return;
					data.receiverId = product.memberId;
					data.productId = refId;
					data.notificationTitle = `${author.memberNick} ${action} your product`;
					data.notificationDesc = product.productTitle;
					break;
				}
				case NotificationGroup.ARTICLE: {
					const article = await this.boardArticleModel
						.findById(refId)
						.select('memberId articleTitle')
						.lean()
						.exec();
					if (!article) return;
					data.receiverId = article.memberId;
					data.articleId = refId;
					data.notificationTitle = `${author.memberNick} ${action} your article`;
					data.notificationDesc = article.articleTitle;
					break;
				}
				case NotificationGroup.MEMBER: {
					data.receiverId = refId;
					data.notificationTitle =
						notificationType === NotificationType.LIKE
							? `${author.memberNick} liked your profile`
							: `${author.memberNick} left a review on your profile`;
					break;
				}
				default:
					return;
			}

			// no self-notifications
			if (String(data.receiverId) === String(authorId)) return;

			await this.notificationModel.create(data);
		} catch (err) {
			console.log('Error, notifyTarget:', err instanceof Error ? err.message : err);
		}
	}

	/** USER **/

	public async getMyNotifications(memberId: ObjectId, input: NotificationsInquiry): Promise<Notifications> {
		const match: T = { receiverId: memberId };
		if (input.search?.notificationStatus) match.notificationStatus = input.search.notificationStatus;

		const result = await this.aggregateNotifications(match, input);
		result.unreadCount = await this.notificationModel
			.countDocuments({ receiverId: memberId, notificationStatus: NotificationStatus.WAIT })
			.exec();
		return result;
	}

	public async readNotification(memberId: ObjectId, notificationId: ObjectId): Promise<Notification> {
		const result = await this.notificationModel
			.findOneAndUpdate(
				{ _id: notificationId, receiverId: memberId },
				{ notificationStatus: NotificationStatus.READ },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async readAllNotifications(memberId: ObjectId): Promise<number> {
		const result = await this.notificationModel
			.updateMany(
				{ receiverId: memberId, notificationStatus: NotificationStatus.WAIT },
				{ notificationStatus: NotificationStatus.READ },
			)
			.exec();
		return result.modifiedCount;
	}

	/** ADMIN **/

	public async getAllNotificationsByAdmin(input: AllNotificationsInquiry): Promise<Notifications> {
		const { notificationStatus, notificationType, notificationGroup } = input.search;
		const match: T = {};
		if (notificationStatus) match.notificationStatus = notificationStatus;
		if (notificationType) match.notificationType = notificationType;
		if (notificationGroup) match.notificationGroup = notificationGroup;

		const result = await this.aggregateNotifications(match, input, true);
		result.unreadCount = await this.notificationModel
			.countDocuments({ notificationStatus: NotificationStatus.WAIT })
			.exec();
		return result;
	}

	public async removeNotificationByAdmin(notificationId: ObjectId): Promise<Notification> {
		const result = await this.notificationModel.findByIdAndDelete(notificationId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	private async aggregateNotifications(
		match: T,
		input: { page: number; limit: number; sort?: string; direction?: Direction },
		withReceiver = false,
	): Promise<Notifications> {
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const listPipeline: T[] = [
			{ $skip: (input.page - 1) * input.limit },
			{ $limit: input.limit },
			lookupAuthor,
			{ $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
		];
		if (withReceiver) {
			listPipeline.push(lookupReceiver, {
				$unwind: { path: '$receiverData', preserveNullAndEmptyArrays: true },
			});
		}

		const result: Notifications[] = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: listPipeline,
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
}
