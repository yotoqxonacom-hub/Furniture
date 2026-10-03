import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { OrderService } from './order.service';
import { Order, Orders } from '../../libs/dto/order/order';
import { AllOrdersInquiry, OrderInput, OrdersInquiry, OrderStatusInput } from '../../libs/dto/order/order.input';
import { Payment } from '../../libs/dto/payment/payment';
import { PaymentInput } from '../../libs/dto/payment/payment.input';
import { Member } from '../../libs/dto/member/member';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class OrderResolver {
	constructor(private readonly orderService: OrderService) {}

	/** BUYER */

	@UseGuards(AuthGuard)
	@Mutation(() => [Order])
	public async createOrders(
		@Args('input') input: OrderInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Order[]> {
		return await this.orderService.createOrders(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Payment)
	public async payOrders(
		@Args('input') input: PaymentInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Payment> {
		return await this.orderService.payOrders(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async cancelOrder(
		@Args('orderId') orderId: string,
		@Args('cancelReason', { nullable: true }) cancelReason: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Order> {
		return await this.orderService.cancelMyOrder(memberId, shapeIntoMongoObjectId(orderId), cancelReason);
	}

	@UseGuards(AuthGuard)
	@Query(() => Orders)
	public async getMyOrders(
		@Args('input') input: OrdersInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Orders> {
		return await this.orderService.getMyOrders(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Order)
	public async getOrder(@Args('orderId') orderId: string, @AuthMember() member: Member): Promise<Order> {
		return await this.orderService.getOrder(member, shapeIntoMongoObjectId(orderId));
	}

	/** SELLER */

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Orders)
	public async getSellerOrders(
		@Args('input') input: OrdersInquiry,
		@AuthMember('_id') agentId: ObjectId,
	): Promise<Orders> {
		return await this.orderService.getSellerOrders(agentId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Order)
	public async updateOrderStatusBySeller(
		@Args('input') input: OrderStatusInput,
		@AuthMember('_id') agentId: ObjectId,
	): Promise<Order> {
		return await this.orderService.updateOrderStatusBySeller(agentId, input);
	}

	/** ADMIN */

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Orders)
	public async getAllOrdersByAdmin(@Args('input') input: AllOrdersInquiry): Promise<Orders> {
		return await this.orderService.getAllOrdersByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Order)
	public async updateOrderByAdmin(
		@Args('input') input: OrderStatusInput,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<Order> {
		return await this.orderService.updateOrderByAdmin(adminId, input);
	}
}
