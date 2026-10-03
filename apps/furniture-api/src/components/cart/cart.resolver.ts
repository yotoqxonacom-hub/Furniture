import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { CartService } from './cart.service';
import { Cart, CartItem } from '../../libs/dto/cart/cart';
import { CartItemInput } from '../../libs/dto/cart/cart.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
@UseGuards(AuthGuard)
export class CartResolver {
	constructor(private readonly cartService: CartService) {}

	@Query(() => Cart)
	public async getMyCart(@AuthMember('_id') memberId: ObjectId): Promise<Cart> {
		return await this.cartService.getMyCart(memberId);
	}

	@Query(() => Int)
	public async getCartCount(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		return await this.cartService.getCartCount(memberId);
	}

	@Mutation(() => CartItem)
	public async addToCart(
		@Args('input') input: CartItemInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<CartItem> {
		return await this.cartService.addToCart(memberId, input);
	}

	@Mutation(() => CartItem)
	public async updateCartItem(
		@Args('input') input: CartItemInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<CartItem> {
		return await this.cartService.updateCartItem(memberId, input);
	}

	@Mutation(() => CartItem)
	public async removeCartItem(
		@Args('productId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<CartItem> {
		return await this.cartService.removeCartItem(memberId, shapeIntoMongoObjectId(input));
	}

	@Mutation(() => Int)
	public async clearCart(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		return await this.cartService.clearCart(memberId);
	}
}
