import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { NotificationService } from './notification.service';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { AllNotificationsInquiry, NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	@UseGuards(AuthGuard)
	@Query(() => Notifications)
	public async getMyNotifications(
		@Args('input') input: NotificationsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notifications> {
		console.log('Query: getMyNotifications');
		return await this.notificationService.getMyNotifications(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	public async readNotification(
		@Args('notificationId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notification> {
		console.log('Mutation: readNotification');
		const notificationId = shapeIntoMongoObjectId(input);
		return await this.notificationService.readNotification(memberId, notificationId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Int)
	public async readAllNotifications(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		console.log('Mutation: readAllNotifications');
		return await this.notificationService.readAllNotifications(memberId);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Notifications)
	public async getAllNotificationsByAdmin(
		@Args('input') input: AllNotificationsInquiry,
	): Promise<Notifications> {
		console.log('Query: getAllNotificationsByAdmin');
		return await this.notificationService.getAllNotificationsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Notification)
	public async removeNotificationByAdmin(@Args('notificationId') input: string): Promise<Notification> {
		console.log('Mutation: removeNotificationByAdmin');
		const notificationId = shapeIntoMongoObjectId(input);
		return await this.notificationService.removeNotificationByAdmin(notificationId);
	}
}
