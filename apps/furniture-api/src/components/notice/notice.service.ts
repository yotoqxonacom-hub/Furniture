import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { AllNoticesInquiry, NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { NoticeStatus } from '../../libs/enums/notice.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { lookupMember } from '../../libs/config';

@Injectable()
export class NoticeService {
	constructor(@InjectModel('Notice') private readonly noticeModel: Model<Notice>) {}

	/** PUBLIC **/

	public async getNotices(input: NoticesInquiry): Promise<Notices> {
		const { noticeCategory, text } = input.search;
		const match: T = { noticeCategory: noticeCategory, noticeStatus: NoticeStatus.ACTIVE };
		if (text) match.$or = this.textFilter(text);
		return await this.aggregateNotices(match, input);
	}

	public async getNotice(noticeId: ObjectId): Promise<Notice> {
		const result = await this.noticeModel
			.findOne({ _id: noticeId, noticeStatus: NoticeStatus.ACTIVE })
			.lean()
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result as unknown as Notice;
	}

	/** ADMIN **/

	public async createNotice(memberId: ObjectId, input: NoticeInput): Promise<Notice> {
		input.memberId = memberId;
		try {
			return await this.noticeModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err instanceof Error ? err.message : err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateNotice(input: NoticeUpdate): Promise<Notice> {
		const result = await this.noticeModel
			.findOneAndUpdate({ _id: input._id }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async removeNotice(noticeId: ObjectId): Promise<Notice> {
		const result = await this.noticeModel
			.findOneAndDelete({ _id: noticeId, noticeStatus: NoticeStatus.DELETE })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	public async getAllNoticesByAdmin(input: AllNoticesInquiry): Promise<Notices> {
		const { noticeCategory, noticeStatus, text } = input.search;
		const match: T = {};
		if (noticeCategory) match.noticeCategory = noticeCategory;
		if (noticeStatus) match.noticeStatus = noticeStatus;
		if (text) match.$or = this.textFilter(text);
		return await this.aggregateNotices(match, input, true);
	}

	private textFilter(text: string): T[] {
		const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const regex = new RegExp(escaped, 'i');
		return [{ noticeTitle: { $regex: regex } }, { noticeContent: { $regex: regex } }];
	}

	private async aggregateNotices(
		match: T,
		input: { page: number; limit: number; sort?: string; direction?: Direction },
		withMember = false,
	): Promise<Notices> {
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const listPipeline: T[] = [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }];
		if (withMember) {
			listPipeline.push(lookupMember, {
				$unwind: { path: '$memberData', preserveNullAndEmptyArrays: true },
			});
		}

		const result: Notices[] = await this.noticeModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: listPipeline,
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
}
