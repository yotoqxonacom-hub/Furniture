import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { MemberService } from '../member/member.service';
import { Report, Reports } from '../../libs/dto/report/report';
import { AllReportsInquiry, ReportInput, ReportsInquiry } from '../../libs/dto/report/report.input';
import { ReportUpdate } from '../../libs/dto/report/report.update';
import { ReportGroup, ReportStatus } from '../../libs/enums/report.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { lookupMember } from '../../libs/config';

@Injectable()
export class ReportService {
	constructor(
		@InjectModel('Report') private readonly reportModel: Model<Report>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
		@InjectModel('Product') private readonly productModel: Model<any>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<any>,
		private readonly memberService: MemberService,
	) {}

	public async createReport(memberId: ObjectId, input: ReportInput): Promise<Report> {
		input.memberId = memberId;

		const ownerId = await this.findTargetOwner(input.reportGroup, input.reportRefId);
		if (!ownerId) throw new BadRequestException(Message.NO_DATA_FOUND);
		if (String(ownerId) === String(memberId)) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		try {
			return await this.reportModel.create(input);
		} catch (err) {
			// unique index: one report per member per target
			console.log('Error, Service.model:', err instanceof Error ? err.message : err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMyReports(memberId: ObjectId, input: ReportsInquiry): Promise<Reports> {
		const match: T = { memberId: memberId };
		if (input.search?.reportStatus) match.reportStatus = input.search.reportStatus;
		return await this.aggregateReports(match, input);
	}

	public async getAllReportsByAdmin(input: AllReportsInquiry): Promise<Reports> {
		const { reportStatus, reportGroup, reportReason } = input.search;
		const match: T = {};
		if (reportStatus) match.reportStatus = reportStatus;
		if (reportGroup) match.reportGroup = reportGroup;
		if (reportReason) match.reportReason = reportReason;
		return await this.aggregateReports(match, input);
	}

	public async updateReportByAdmin(input: ReportUpdate): Promise<Report> {
		const { _id, reportStatus } = input;
		const previous = await this.reportModel.findById(_id).exec();
		if (!previous) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const result = await this.reportModel
			.findOneAndUpdate({ _id: _id }, { reportStatus: reportStatus }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		// confirmed report -> warning for the responsible member (agent / author); undo if reverted
		const wasResolved = previous.reportStatus === ReportStatus.RESOLVED;
		const isResolved = reportStatus === ReportStatus.RESOLVED;
		if (wasResolved !== isResolved) {
			const ownerId = await this.findTargetOwner(result.reportGroup, result.reportRefId);
			if (ownerId) {
				await this.memberService.memberStatsEditor({
					_id: ownerId,
					targetKey: 'memberWarnings',
					modifier: isResolved ? 1 : -1,
				});
			}
		}

		return result;
	}

	/** Member responsible for the reported target: the member itself, the product's agent or the article's author */
	private async findTargetOwner(group: ReportGroup, refId: ObjectId): Promise<ObjectId | null> {
		switch (group) {
			case ReportGroup.MEMBER: {
				const member = await this.memberModel.findById(refId).exec();
				return member ? member._id : null;
			}
			case ReportGroup.PRODUCT: {
				const product = await this.productModel.findById(refId).exec();
				return product ? product.memberId : null;
			}
			case ReportGroup.ARTICLE: {
				const article = await this.boardArticleModel.findById(refId).exec();
				return article ? article.memberId : null;
			}
			default:
				return null;
		}
	}

	private async aggregateReports(
		match: T,
		input: { page: number; limit: number; sort?: string; direction?: Direction },
	): Promise<Reports> {
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result: Reports[] = await this.reportModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
}
