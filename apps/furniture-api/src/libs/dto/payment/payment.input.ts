import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayMaxSize, ArrayNotEmpty, IsIn, IsMongoId, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../enums/payment.enum';
import { Direction } from '../../enums/common.enum';
import { availablePaymentSorts } from '../../config';

@InputType()
export class PaymentInput {
	/** unpaid (PENDING) orders of the buyer, usually all orders from one checkout */
	@ArrayNotEmpty()
	@ArrayMaxSize(20)
	@IsMongoId({ each: true })
	@Field(() => [String])
	orderIds: string[];

	@IsNotEmpty()
	@Field(() => PaymentMethod)
	paymentMethod: PaymentMethod;
}

/** internal: what OrderService asks PaymentService to charge */
export interface ChargeInput {
	memberId: ObjectId;
	orderIds: ObjectId[];
	paymentAmount: number;
	paymentMethod: PaymentMethod;
}

@InputType()
class PaymentSearch {
	@IsOptional()
	@Field(() => PaymentStatus, { nullable: true })
	paymentStatus?: PaymentStatus;

	@IsOptional()
	@Field(() => PaymentMethod, { nullable: true })
	paymentMethod?: PaymentMethod;
}

@InputType()
export class PaymentsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePaymentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PaymentSearch)
	search: PaymentSearch;
}
