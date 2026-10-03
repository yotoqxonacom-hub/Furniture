import { Field, InputType, Int } from '@nestjs/graphql';
import {
	ArrayMaxSize,
	IsIn,
	IsMongoId,
	IsNotEmpty,
	IsOptional,
	Length,
	Matches,
	Min,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../enums/order.enum';
import { ProductLocation } from '../../enums/product.enum';
import { Direction } from '../../enums/common.enum';
import { availableOrderSorts } from '../../config';

@InputType()
export class ShippingAddressInput {
	@IsNotEmpty()
	@Length(2, 50)
	@Field(() => String)
	recipientName: string;

	@IsNotEmpty()
	@Matches(/^\+?[0-9\s-]{7,20}$/)
	@Field(() => String)
	recipientPhone: string;

	@IsNotEmpty()
	@Field(() => ProductLocation)
	city: ProductLocation;

	@IsNotEmpty()
	@Length(5, 200)
	@Field(() => String)
	address: string;

	@IsOptional()
	@Length(0, 200)
	@Field(() => String, { nullable: true })
	note?: string;
}

@InputType()
export class OrderInput {
	@ValidateNested()
	@Type(() => ShippingAddressInput)
	@Field(() => ShippingAddressInput)
	shippingAddress: ShippingAddressInput;

	/** checkout only these cart products; empty / missing = the whole cart */
	@IsOptional()
	@IsMongoId({ each: true })
	@ArrayMaxSize(50)
	@Field(() => [String], { nullable: true })
	productIds?: string[];
}

@InputType()
export class OrderStatusInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	orderId: string;

	@IsNotEmpty()
	@Field(() => OrderStatus)
	orderStatus: OrderStatus;

	/** stored when the new status is CANCELLED */
	@IsOptional()
	@Length(0, 200)
	@Field(() => String, { nullable: true })
	cancelReason?: string;
}

@InputType()
class OrderSearch {
	@IsOptional()
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;
}

@InputType()
export class OrdersInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableOrderSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => OrderSearch)
	search: OrderSearch;
}

@InputType()
class AllOrderSearch {
	@IsOptional()
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	agentId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;
}

@InputType()
export class AllOrdersInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableOrderSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AllOrderSearch)
	search: AllOrderSearch;
}
