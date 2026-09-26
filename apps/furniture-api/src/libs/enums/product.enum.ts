import { registerEnumType } from '@nestjs/graphql';

export enum ProductType {
	SOFA = 'SOFA',
	CORNER_SOFA = 'CORNER_SOFA',
	ARMCHAIR = 'ARMCHAIR',
	BED = 'BED',
	POUF = 'POUF',
	MATTRESS = 'MATTRESS',
	KIDS = 'KIDS',
}
registerEnumType(ProductType, {
	name: 'ProductType',
});

export enum ProductStatus {
	ACTIVE = 'ACTIVE',
	SOLD = 'SOLD',
	DELETE = 'DELETE',
}
registerEnumType(ProductStatus, {
	name: 'ProductStatus',
});

export enum ProductLocation {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU',
	CHONJU = 'CHONJU',
	DAEJON = 'DAEJON',
	JEJU = 'JEJU',
}
registerEnumType(ProductLocation, {
	name: 'ProductLocation',
});
