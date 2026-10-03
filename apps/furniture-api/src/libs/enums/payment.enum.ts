import { registerEnumType } from '@nestjs/graphql';

export enum PaymentMethod {
	CARD = 'CARD',
	KAKAO_PAY = 'KAKAO_PAY',
	TOSS_PAY = 'TOSS_PAY',
	BANK_TRANSFER = 'BANK_TRANSFER',
}
registerEnumType(PaymentMethod, {
	name: 'PaymentMethod',
});

export enum PaymentStatus {
	PAID = 'PAID',
	PARTIAL_REFUNDED = 'PARTIAL_REFUNDED',
	REFUNDED = 'REFUNDED',
}
registerEnumType(PaymentStatus, {
	name: 'PaymentStatus',
});
