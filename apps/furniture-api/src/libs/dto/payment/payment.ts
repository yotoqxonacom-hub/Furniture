import { Field, Float, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../enums/payment.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Payment {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => PaymentMethod)
	paymentMethod: PaymentMethod;

	@Field(() => PaymentStatus)
	paymentStatus: PaymentStatus;

	@Field(() => Float)
	paymentAmount: number;

	@Field(() => Float)
	refundedAmount: number;

	@Field(() => String)
	transactionKey: string;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => [String])
	orderIds: ObjectId[];

	@Field(() => Date, { nullable: true })
	paidAt?: Date;

	@Field(() => Date, { nullable: true })
	refundedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation */
	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Payments {
	@Field(() => [Payment])
	list: Payment[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
