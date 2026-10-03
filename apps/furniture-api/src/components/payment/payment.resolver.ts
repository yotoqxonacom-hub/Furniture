import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { PaymentService } from './payment.service';
import { Payments } from '../../libs/dto/payment/payment';
import { PaymentsInquiry } from '../../libs/dto/payment/payment.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';

/** paying happens through OrderResolver.payOrders; this resolver only lists payments */
@Resolver()
export class PaymentResolver {
	constructor(private readonly paymentService: PaymentService) {}

	@UseGuards(AuthGuard)
	@Query(() => Payments)
	public async getMyPayments(
		@Args('input') input: PaymentsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Payments> {
		return await this.paymentService.getMyPayments(memberId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Payments)
	public async getAllPaymentsByAdmin(@Args('input') input: PaymentsInquiry): Promise<Payments> {
		return await this.paymentService.getAllPaymentsByAdmin(input);
	}
}
