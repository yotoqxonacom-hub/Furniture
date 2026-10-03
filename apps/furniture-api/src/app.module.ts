import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';
import { SocketModule } from './socket/socket.module';
import { Message } from './libs/enums/common.enum';

/**
 * Always a plain string for the client. Nest puts the HttpException body in extensions.originalError
 * ({ message, error, statusCode }) and class-validator puts an array of messages there;
 * returning that object made the frontend show "[object Object]".
 */
export const readableErrorMessage = (error: T): string => {
	const ext = error?.extensions ?? {};
	const candidates = [ext.originalError?.message, ext.exception?.response?.message, ext.response?.message, error?.message];
	for (const value of candidates) {
		if (Array.isArray(value) && value.length) return value.map(String).join(', ');
		if (typeof value === 'string' && value.trim()) return value;
	}
	return Message.SOMETHING_WENT_WRONG;
};

@Module({
	imports: [
		ConfigModule.forRoot(),
		ScheduleModule.forRoot(), // expires unpaid orders (OrderService)
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: true,
			uploads: false,
			autoSchemaFile: true,
			formatError: (error: T) => {
				const graphQLFormattedError = { message: readableErrorMessage(error), extensions: { code: error?.extensions?.code } };
				console.log('GRAPHQL GLOBAL ERR:', graphQLFormattedError);
				return graphQLFormattedError;
			},
		}),
		ComponentsModule,
		DatabaseModule,
		SocketModule,
	],
	controllers: [AppController],
	providers: [AppService, AppResolver],
})
export class AppModule {}
