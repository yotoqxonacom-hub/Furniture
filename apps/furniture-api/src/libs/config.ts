import { ObjectId } from 'bson';

export const availableAgentSorts = [
	'createdAt',
	'updatedAt',
	'memberLikes',
	'memberViews',
	'memberRank',
];
export const availableMemberSorts = [
	'createdAt',
	'updatedAt',
	'memberLikes',
	'memberViews',
];
export const availableOptions = ['productBarter'];
export const availableBoardArticleSorts = [
	'createdAt',
	'updatedAt',
	'articleLikes',
	'articleViews',
];
export const availableProductSorts = [
	'createdAt',
	'updatedAt',
	'productLikes',
	'productViews',
	'productRank',
	'productPrice',
];
export const availableCommentSorts = ['createdAt', 'updatedAt'];
export const availableReportSorts = ['createdAt', 'updatedAt'];
export const availableNoticeSorts = ['createdAt', 'updatedAt', 'noticeTitle'];
export const availableNotificationSorts = ['createdAt', 'updatedAt'];
export const availableOrderSorts = ['createdAt', 'updatedAt', 'orderTotal'];
export const availablePaymentSorts = ['createdAt', 'paymentAmount'];

// ORDER RULES (prices are in the same currency as productPrice)
export const ORDER_RULES = {
	/** most pieces of one product a member can keep in the cart */
	MAX_CART_QUANTITY: 10,
	/** delivery fee per seller order, waived from FREE_DELIVERY_FROM */
	DELIVERY_FEE: 50,
	FREE_DELIVERY_FROM: 1000,
	/** unpaid orders are cancelled and their stock released after this many minutes */
	PENDING_TTL_MINUTES: 30,
};

export const deliveryFeeFor = (subtotal: number): number =>
	subtotal >= ORDER_RULES.FREE_DELIVERY_FROM ? 0 : ORDER_RULES.DELIVERY_FEE;

// IMAGE CONFIGURATION (config.js)
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { mkdirSync } from 'fs';
import { T } from './types/common';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
export const validUploadTargets = ['member', 'product', 'article'];

/** Returns a safe upload folder for the target (creating it on first use) or throws */
export const prepareUploadFolder = (target: string): string => {
	if (!validUploadTargets.includes(target)) throw new Error('Upload failed!');
	const folder = `uploads/${target}`;
	mkdirSync(folder, { recursive: true });
	return folder;
};
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};

/**
 * Case-insensitive "contains" regex from user text. Special characters are escaped,
 * so a search like "sofa (2)" or "*" no longer throws "Invalid regular expression".
 */
export const textRegex = (text: string): RegExp =>
	new RegExp(text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

export const shapeIntoMongoObjectId = (target: any) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return typeof target === 'string' ? new ObjectId(target) : target;
};

export const lookupAuthMemberLiked = (memberId: T, targetRefId: string = '$_id') => {
	return {
		$lookup: {
			from: 'likes',
			let: {
				localLikeRefId: targetRefId,
				localMemberId: memberId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$likeRefId', '$$localLikeRefId'] },
								{ $eq: ['$memberId', '$$localMemberId'] },
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						memberId: 1,
						likeRefId: 1,
						myFavorite: '$$localMyFavorite',
					},
				},
			],
			as: 'meLiked',
		},
	};
};

interface LookupAuthMemberFollowed {
	followerId: T;
	followingId: string;
}
export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => {
	const { followerId, followingId } = input;
	return {
		$lookup: {
			from: 'follows',
			let: {
				localFollowerId: followerId,
				localFollowingId: followingId, //"$followingId"
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$followerId', '$$localFollowerId'] },
								{ $eq: ['$followingId', '$$localFollowingId'] },
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						followerId: 1,
						followingId: 1,
						myFollowing: '$$localMyFavorite',
					},
				},
			],
			as: 'meFollowed',
		},
	};
};

export const lookupMember = {
	$lookup: {
		from: 'members',
		localField: 'memberId',
		foreignField: '_id',
		as: 'memberData',
	},
};

export const lookupFollowingData = {
	$lookup: {
		from: 'members',
		localField: 'followingId',
		foreignField: '_id',
		as: 'followingData',
	},
};

export const lookupFollowerData = {
	$lookup: {
		from: 'members',
		localField: 'followerId',
		foreignField: '_id',
		as: 'followerData',
	},
};

export const lookupFavorite = {
	$lookup: {
		from: 'members',
		localField: 'favoriteProduct.memberId',
		foreignField: '_id',
		as: 'favoriteProduct.memberData',
	},
};

export const lookupVisit = {
	$lookup: {
		from: 'members',
		localField: 'visitedProduct.memberId',
		foreignField: '_id',
		as: 'visitedProduct.memberData',
	},
};

export const lookupAuthor = {
	$lookup: {
		from: 'members',
		localField: 'authorId',
		foreignField: '_id',
		as: 'authorData',
	},
};

export const lookupReceiver = {
	$lookup: {
		from: 'members',
		localField: 'receiverId',
		foreignField: '_id',
		as: 'receiverData',
	},
};

export const lookupProduct = {
	$lookup: {
		from: 'products',
		localField: 'productId',
		foreignField: '_id',
		as: 'productData',
	},
};

export const lookupAgent = {
	$lookup: {
		from: 'members',
		localField: 'agentId',
		foreignField: '_id',
		as: 'agentData',
	},
};

export const lookupOrderItems = {
	$lookup: {
		from: 'orderItems',
		localField: '_id',
		foreignField: 'orderId',
		as: 'orderItems',
	},
};
