import { registerEnumType } from '@nestjs/graphql';

export enum ReportGroup {
	MEMBER = 'MEMBER',
	PRODUCT = 'PRODUCT',
	ARTICLE = 'ARTICLE',
}
registerEnumType(ReportGroup, {
	name: 'ReportGroup',
});

export enum ReportReason {
	WRONG_DESCRIPTION = 'WRONG_DESCRIPTION',
	POOR_QUALITY = 'POOR_QUALITY',
	FAKE_PRODUCT = 'FAKE_PRODUCT',
	RUDE_AGENT = 'RUDE_AGENT',
	NOT_DELIVERED = 'NOT_DELIVERED',
	OTHER = 'OTHER',
}
registerEnumType(ReportReason, {
	name: 'ReportReason',
});

export enum ReportStatus {
	PENDING = 'PENDING',
	RESOLVED = 'RESOLVED',
	REJECTED = 'REJECTED',
}
registerEnumType(ReportStatus, {
	name: 'ReportStatus',
});
