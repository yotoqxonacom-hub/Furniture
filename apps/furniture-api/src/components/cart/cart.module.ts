import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartResolver } from './cart.resolver';
import { CartService } from './cart.service';
import CartItemSchema from '../../schemas/CartItem.model';
import ProductSchema from '../../schemas/Product.model';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'CartItem', schema: CartItemSchema },
			{ name: 'Product', schema: ProductSchema },
		]),
		AuthModule,
	],
	providers: [CartResolver, CartService],
	exports: [CartService],
})
export class CartModule {}
