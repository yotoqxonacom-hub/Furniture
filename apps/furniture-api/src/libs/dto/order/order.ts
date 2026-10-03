import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { OrderStatus } from '../../enums/order.enum';
import { ProductLocation } from '../../enums/product.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class ShippingAddress {
	@Field(() => String)
	recipientName: string;

	@Field(() => String)
	recipientPhone: string;

	@Field(() => ProductLocation)
	city: ProductLocation;

	@Field(() => String)
	address: string;

	@Field(() => String, { nullable: true })
	note?: string;
}

@ObjectType()
export class OrderItem {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	orderId: ObjectId;

	@Field(() => String)
	productId: ObjectId;

	@Field(() => Int)
	itemQuantity: number;

	@Field(() => Float)
	itemPrice: number;

	@Field(() => String)
	productTitle: string;

	@Field(() => String, { nullable: true })
	productImage?: string;

	@Field(() => Date)
	createdAt: Date;
}

@ObjectType()
export class Order {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => OrderStatus)
	orderStatus: OrderStatus;

	@Field(() => Float)
	orderSubtotal: number;

	@Field(() => Float)
	orderDeliveryFee: number;

	@Field(() => Float)
	orderTotal: number;

	@Field(() => ShippingAddress)
	shippingAddress: ShippingAddress;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	agentId: ObjectId;

	@Field(() => String, { nullable: true })
	paymentId?: ObjectId;

	@Field(() => String, { nullable: true })
	cancelReason?: string;

	@Field(() => Date, { nullable: true })
	paidAt?: Date;

	@Field(() => Date, { nullable: true })
	processedAt?: Date;

	@Field(() => Date, { nullable: true })
	shippedAt?: Date;

	@Field(() => Date, { nullable: true })
	deliveredAt?: Date;

	@Field(() => Date, { nullable: true })
	cancelledAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation */

	@Field(() => [OrderItem], { nullable: true })
	orderItems?: OrderItem[];

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => Member, { nullable: true })
	agentData?: Member;
}

@ObjectType()
export class Orders {
	@Field(() => [Order])
	list: Order[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
