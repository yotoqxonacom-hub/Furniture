import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsMongoId, IsNotEmpty, Max, Min } from 'class-validator';
import { ORDER_RULES } from '../../config';

@InputType()
export class CartItemInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	productId: string;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Max(ORDER_RULES.MAX_CART_QUANTITY)
	@Field(() => Int)
	quantity: number;
}
