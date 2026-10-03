import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Product } from '../product/product';

@ObjectType()
export class CartItem {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	productId: ObjectId;

	@Field(() => Int)
	quantity: number;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation (with the seller in productData.memberData) */
	@Field(() => Product, { nullable: true })
	productData?: Product;
}

@ObjectType()
export class Cart {
	@Field(() => [CartItem])
	list: CartItem[];

	/** sum of quantities (the header badge) */
	@Field(() => Int)
	totalQuantity: number;

	@Field(() => Float)
	subtotal: number;

	/** one fee per seller, see ORDER_RULES */
	@Field(() => Float)
	deliveryFee: number;

	@Field(() => Float)
	total: number;
}
