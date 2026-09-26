import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ReportStatus } from '../../enums/report.enum';

@InputType()
export class ReportUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsNotEmpty()
	@Field(() => ReportStatus)
	reportStatus: ReportStatus;
}
