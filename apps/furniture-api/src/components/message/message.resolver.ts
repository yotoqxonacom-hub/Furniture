import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { MessageService } from './message.service';
import { Conversations, Message, Messages } from '../../libs/dto/message/message';
import { MessageInput, MessagesInquiry } from '../../libs/dto/message/message.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class MessageResolver {
	constructor(private readonly messageService: MessageService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Message)
	public async sendMessage(
		@Args('input') input: MessageInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Message> {
		console.log('Mutation: sendMessage');
		return await this.messageService.sendMessage(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Conversations)
	public async getConversations(@AuthMember('_id') memberId: ObjectId): Promise<Conversations> {
		console.log('Query: getConversations');
		return await this.messageService.getConversations(memberId);
	}

	@UseGuards(AuthGuard)
	@Query(() => Messages)
	public async getMessages(
		@Args('input') input: MessagesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Messages> {
		console.log('Query: getMessages');
		return await this.messageService.getMessages(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Int)
	public async markConversationRead(
		@Args('partnerId') partnerId: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<number> {
		console.log('Mutation: markConversationRead');
		return await this.messageService.markConversationRead(memberId, partnerId);
	}
}
