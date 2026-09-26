import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ReportGroup, ReportReason, ReportStatus } from '../../enums/report.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Report {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ReportStatus)
	reportStatus: ReportStatus;

	@Field(() => ReportGroup)
	reportGroup: ReportGroup;

	@Field(() => ReportReason)
	reportReason: ReportReason;

	@Field(() => String, { nullable: true })
	reportDesc?: string;

	@Field(() => String)
	reportRefId: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Reports {
	@Field(() => [Report])
	list: Report[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
