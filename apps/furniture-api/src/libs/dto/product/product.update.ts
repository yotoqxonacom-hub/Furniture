import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import {
	ProductLocation,
	ProductStatus,
	ProductType,
} from '../../enums/product.enum';
import { ObjectId } from 'mongoose';

@InputType()
export class ProductUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => ProductType, { nullable: true })
	productType?: ProductType;

	@IsOptional()
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsOptional()
	@Field(() => ProductLocation, { nullable: true })
	productLocation?: ProductLocation;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	productAddress?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	productTitle?: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	productPrice?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	productSquare?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	productBeds?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	productRooms?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(999)
	@Field(() => Int, { nullable: true })
	productStock?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	productImages?: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	productDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	productBarter?: boolean;

	soldAt?: Date;

	deletedAt?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	constructedAt?: Date;
}
