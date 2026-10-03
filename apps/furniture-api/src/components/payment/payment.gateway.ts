import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaymentMethod } from '../../libs/enums/payment.enum';

export interface GatewayCharge {
	amount: number;
	method: PaymentMethod;
	/** our reference shown in the provider dashboard */
	reference: string;
}

export interface GatewayResult {
	transactionKey: string;
	approvedAt: Date;
}

/**
 * The single place that talks to a payment provider.
 *
 * This build approves every charge locally (demo / development). To go live, replace the
 * bodies of `charge` and `refund` with the provider's API (Toss Payments `/v1/payments/confirm`
 * and `/v1/payments/{paymentKey}/cancel`, or PortOne), keeping the same signatures — nothing
 * else in the order flow has to change.
 */
@Injectable()
export class PaymentGateway {
	public async charge(input: GatewayCharge): Promise<GatewayResult> {
		if (input.amount <= 0) throw new Error('Amount must be positive');
		return { transactionKey: `demo_${input.method.toLowerCase()}_${randomUUID()}`, approvedAt: new Date() };
	}

	public async refund(transactionKey: string, amount: number): Promise<void> {
		if (!transactionKey || amount <= 0) throw new Error('Nothing to refund');
	}
}
