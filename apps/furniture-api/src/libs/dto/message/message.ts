import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { MessageStatus } from '../../enums/message.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Message {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	conversationKey: string;

	@Field(() => String)
	senderId: ObjectId;

	@Field(() => String)
	receiverId: ObjectId;

	@Field(() => String)
	messageText: string;

	@Field(() => MessageStatus)
	messageStatus: MessageStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Messages {
	@Field(() => [Message])
	list: Message[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}

@ObjectType()
export class Conversation {
	@Field(() => String)
	conversationKey: string;

	@Field(() => String)
	partnerId: ObjectId;

	@Field(() => Member, { nullable: true })
	partnerData?: Member;

	@Field(() => Message)
	lastMessage: Message;

	@Field(() => Int)
	unreadCount: number;

	@Field(() => Boolean)
	partnerOnline: boolean;
}

@ObjectType()
export class Conversations {
	@Field(() => [Conversation])
	list: Conversation[];

	@Field(() => Int)
	totalUnread: number;
}
