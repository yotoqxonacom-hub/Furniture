import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, Length, Max, Min } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class MessageInput {
	@IsNotEmpty()
	@Field(() => String)
	receiverId: ObjectId;

	@IsNotEmpty()
	@Length(1, 1000)
	@Field(() => String)
	messageText: string;
}

@InputType()
export class MessagesInquiry {
	@IsNotEmpty()
	@Field(() => String)
	partnerId: ObjectId;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit: number;
}
