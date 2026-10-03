import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Cart, CartItem } from '../../libs/dto/cart/cart';
import { CartItemInput } from '../../libs/dto/cart/cart.input';
import { Product } from '../../libs/dto/product/product';
import { Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import { deliveryFeeFor, lookupProduct, ORDER_RULES, shapeIntoMongoObjectId } from '../../libs/config';
import { T } from '../../libs/types/common';

@Injectable()
export class CartService {
	constructor(
		@InjectModel('CartItem') private readonly cartItemModel: Model<CartItem>,
		@InjectModel('Product') private readonly productModel: Model<Product>,
	) {}

	/** Adds the product, or increases the quantity when it is already in the cart */
	public async addToCart(memberId: ObjectId, input: CartItemInput): Promise<CartItem> {
		const productId = shapeIntoMongoObjectId(input.productId);
		const product = await this.findBuyableProduct(memberId, productId);

		const existing = await this.cartItemModel.findOne({ memberId, productId }).lean<CartItem>().exec();
		const quantity = (existing?.quantity ?? 0) + input.quantity;
		this.assertQuantity(quantity, product);

		return await this.cartItemModel
			.findOneAndUpdate({ memberId, productId }, { quantity }, { new: true, upsert: true })
			.exec();
	}

	/** Sets the exact quantity (the +/- buttons on the cart page) */
	public async updateCartItem(memberId: ObjectId, input: CartItemInput): Promise<CartItem> {
		const productId = shapeIntoMongoObjectId(input.productId);
		const product = await this.findBuyableProduct(memberId, productId);
		this.assertQuantity(input.quantity, product);

		const result = await this.cartItemModel
			.findOneAndUpdate({ memberId, productId }, { quantity: input.quantity }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async removeCartItem(memberId: ObjectId, productId: ObjectId): Promise<CartItem> {
		const result = await this.cartItemModel.findOneAndDelete({ memberId, productId }).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	public async clearCart(memberId: ObjectId): Promise<number> {
		const result = await this.cartItemModel.deleteMany({ memberId }).exec();
		return result.deletedCount;
	}

	/** Cart page: items with live product data, plus totals (delivery fee counted per seller) */
	public async getMyCart(memberId: ObjectId): Promise<Cart> {
		const list: CartItem[] = await this.cartItemModel
			.aggregate([
				{ $match: { memberId } },
				{ $sort: { createdAt: -1 } },
				lookupProduct,
				{ $unwind: '$productData' },
				{
					$lookup: {
						from: 'members',
						localField: 'productData.memberId',
						foreignField: '_id',
						as: 'productData.memberData',
					},
				},
				{ $unwind: { path: '$productData.memberData', preserveNullAndEmptyArrays: true } },
			])
			.exec();

		const buyable = list.filter((item) => item.productData?.productStatus === ProductStatus.ACTIVE);
		const subtotalBySeller = new Map<string, number>();
		for (const item of buyable) {
			const seller = String(item.productData?.memberId);
			const line = (item.productData?.productPrice ?? 0) * item.quantity;
			subtotalBySeller.set(seller, (subtotalBySeller.get(seller) ?? 0) + line);
		}

		const sellerSubtotals = [...subtotalBySeller.values()];
		const subtotal = sellerSubtotals.reduce((sum, value) => sum + value, 0);
		const deliveryFee = sellerSubtotals.reduce((sum, value) => sum + deliveryFeeFor(value), 0);

		return {
			list,
			totalQuantity: list.reduce((sum, item) => sum + item.quantity, 0),
			subtotal,
			deliveryFee,
			total: subtotal + deliveryFee,
		};
	}

	/** Header badge: just the number of pieces */
	public async getCartCount(memberId: ObjectId): Promise<number> {
		const result: T[] = await this.cartItemModel
			.aggregate([{ $match: { memberId } }, { $group: { _id: null, total: { $sum: '$quantity' } } }])
			.exec();
		return result[0]?.total ?? 0;
	}

	/** USED BY ORDERS */

	public async getItemsForCheckout(memberId: ObjectId, productIds?: ObjectId[]): Promise<CartItem[]> {
		const match: T = { memberId };
		if (productIds?.length) match.productId = { $in: productIds };
		return await this.cartItemModel.find(match).lean<CartItem[]>().exec();
	}

	public async removeItems(memberId: ObjectId, productIds: ObjectId[]): Promise<void> {
		await this.cartItemModel.deleteMany({ memberId, productId: { $in: productIds } }).exec();
	}

	/** HELPERS */

	private async findBuyableProduct(memberId: ObjectId, productId: ObjectId): Promise<Product> {
		const product = await this.productModel
			.findOne({ _id: productId, productStatus: ProductStatus.ACTIVE })
			.lean<Product>()
			.exec();
		if (!product) throw new BadRequestException(Message.PRODUCT_NOT_AVAILABLE);
		if (String(product.memberId) === String(memberId)) throw new BadRequestException(Message.OWN_PRODUCT);
		return product;
	}

	private assertQuantity(quantity: number, product: Product): void {
		if (quantity > ORDER_RULES.MAX_CART_QUANTITY) throw new BadRequestException(Message.CART_LIMIT);
		if (quantity > product.productStock) throw new BadRequestException(Message.OUT_OF_STOCK);
	}
}
