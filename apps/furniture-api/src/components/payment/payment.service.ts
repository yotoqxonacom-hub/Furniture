import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Payment, Payments } from '../../libs/dto/payment/payment';
import { ChargeInput, PaymentsInquiry } from '../../libs/dto/payment/payment.input';
import { PaymentStatus } from '../../libs/enums/payment.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';
import { PaymentGateway } from './payment.gateway';

@Injectable()
export class PaymentService {
	constructor(
		@InjectModel('Payment') private readonly paymentModel: Model<Payment>,
		private readonly paymentGateway: PaymentGateway,
	) {}

	/** Charges the buyer through the gateway and records the payment */
	public async charge(input: ChargeInput): Promise<Payment> {
		let approved;
		try {
			approved = await this.paymentGateway.charge({
				amount: input.paymentAmount,
				method: input.paymentMethod,
				reference: input.orderIds.map(String).join(','),
			});
		} catch (err) {
			console.log('Error, charge:', err instanceof Error ? err.message : err);
			throw new BadRequestException(Message.PAYMENT_FAILED);
		}

		return await this.paymentModel.create({
			...input,
			paymentStatus: PaymentStatus.PAID,
			transactionKey: approved.transactionKey,
			paidAt: approved.approvedAt,
		});
	}

	/** Refunds one order's amount; the payment becomes REFUNDED once everything is returned */
	public async refund(paymentId: ObjectId, amount: number): Promise<Payment> {
		const payment = await this.paymentModel.findById(paymentId).lean<Payment>().exec();
		if (!payment) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const refundable = payment.paymentAmount - payment.refundedAmount;
		const refundAmount = Math.min(amount, refundable);
		if (refundAmount <= 0) return payment;

		await this.paymentGateway.refund(payment.transactionKey, refundAmount);

		const refundedAmount = payment.refundedAmount + refundAmount;
		const paymentStatus =
			refundedAmount >= payment.paymentAmount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIAL_REFUNDED;
		const result = await this.paymentModel
			.findByIdAndUpdate(paymentId, { refundedAmount, paymentStatus, refundedAt: new Date() }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async getMyPayments(memberId: ObjectId, input: PaymentsInquiry): Promise<Payments> {
		return await this.aggregatePayments({ memberId, ...this.searchMatch(input) }, input);
	}

	public async getAllPaymentsByAdmin(input: PaymentsInquiry): Promise<Payments> {
		return await this.aggregatePayments(this.searchMatch(input), input, true);
	}

	private searchMatch(input: PaymentsInquiry): T {
		const match: T = {};
		if (input.search?.paymentStatus) match.paymentStatus = input.search.paymentStatus;
		if (input.search?.paymentMethod) match.paymentMethod = input.search.paymentMethod;
		return match;
	}

	private async aggregatePayments(match: T, input: PaymentsInquiry, withMember = false): Promise<Payments> {
		const sort: T = { [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC };
		const list: T[] = [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }];
		if (withMember) list.push(lookupMember, { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } });

		const result: Payments[] = await this.paymentModel
			.aggregate([{ $match: match }, { $sort: sort }, { $facet: { list, metaCounter: [{ $count: 'total' }] } }])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}
}
