import { Schema } from 'mongoose';
import { ReportGroup, ReportReason, ReportStatus } from '../libs/enums/report.enum';

const ReportSchema = new Schema(
	{
		reportStatus: {
			type: String,
			enum: ReportStatus,
			default: ReportStatus.PENDING,
		},

		reportGroup: {
			type: String,
			enum: ReportGroup,
			required: true,
		},

		reportReason: {
			type: String,
			enum: ReportReason,
			required: true,
		},

		reportDesc: {
			type: String,
		},

		reportRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},
	},
	{ timestamps: true, collection: 'reports' },
);

ReportSchema.index({ memberId: 1, reportRefId: 1 }, { unique: true });

export default ReportSchema;
