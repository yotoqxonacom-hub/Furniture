import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';
import MessageSchema from '../../schemas/Message.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../../socket/socket.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Message', schema: MessageSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		SocketModule,
	],
	providers: [MessageResolver, MessageService],
})
export class MessageModule {}
