import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import PaymentSchema from '../../schemas/Payment.model';
import { AuthModule } from '../auth/auth.module';
import { PaymentGateway } from './payment.gateway';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Payment', schema: PaymentSchema }]), AuthModule],
	providers: [PaymentGateway, PaymentService, PaymentResolver],
	exports: [PaymentService],
})
export class PaymentModule {}
