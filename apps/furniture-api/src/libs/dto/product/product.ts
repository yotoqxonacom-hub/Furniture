import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import {
	ProductLocation,
	ProductStatus,
	ProductType,
} from '../../enums/product.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Product {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ProductType)
	productType: ProductType;

	@Field(() => ProductStatus)
	productStatus: ProductStatus;

	@Field(() => ProductLocation)
	productLocation: ProductLocation;

	@Field(() => String)
	productAddress: string;

	@Field(() => String)
	productTitle: string;

	@Field(() => Number)
	productPrice: number;

	@Field(() => Number)
	productSquare: number;

	@Field(() => Int)
	productBeds: number;

	@Field(() => Int)
	productRooms: number;

	@Field(() => Int)
	productStock: number;

	@Field(() => Int)
	productViews: number;

	@Field(() => Int)
	productLikes: number;

	@Field(() => Int)
	productComments: number;

	@Field(() => Int)
	productRank: number;

	@Field(() => [String])
	productImages: string[];

	@Field(() => String, { nullable: true })
	productDesc?: string;

	@Field(() => Boolean)
	productBarter: boolean;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	soldAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date, { nullable: true })
	constructedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation */

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Products {
	@Field(() => [Product])
	list: Product[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
