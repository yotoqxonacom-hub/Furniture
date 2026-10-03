import { registerEnumType } from '@nestjs/graphql';

export enum MessageStatus {
	SENT = 'SENT',
	READ = 'READ',
}
registerEnumType(MessageStatus, {
	name: 'MessageStatus',
});
