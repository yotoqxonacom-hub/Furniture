import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ReportGroup, ReportReason, ReportStatus } from '../../enums/report.enum';
import { Direction } from '../../enums/common.enum';
import { availableReportSorts } from '../../config';

@InputType()
export class ReportInput {
	@IsNotEmpty()
	@Field(() => ReportGroup)
	reportGroup: ReportGroup;

	@IsNotEmpty()
	@Field(() => ReportReason)
	reportReason: ReportReason;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	reportDesc?: string;

	@IsNotEmpty()
	@Field(() => String)
	reportRefId: ObjectId;

	memberId?: ObjectId;
}

@InputType()
class RISearch {
	@IsOptional()
	@Field(() => ReportStatus, { nullable: true })
	reportStatus?: ReportStatus;
}

@InputType()
export class ReportsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableReportSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => RISearch)
	search: RISearch;
}

@InputType()
class ARISearch {
	@IsOptional()
	@Field(() => ReportStatus, { nullable: true })
	reportStatus?: ReportStatus;

	@IsOptional()
	@Field(() => ReportGroup, { nullable: true })
	reportGroup?: ReportGroup;

	@IsOptional()
	@Field(() => ReportReason, { nullable: true })
	reportReason?: ReportReason;
}

@InputType()
export class AllReportsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableReportSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ARISearch)
	search: ARISearch;
}
