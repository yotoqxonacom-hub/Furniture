import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { ReportService } from './report.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { Report, Reports } from '../../libs/dto/report/report';
import { AllReportsInquiry, ReportInput, ReportsInquiry } from '../../libs/dto/report/report.input';
import { ReportUpdate } from '../../libs/dto/report/report.update';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class ReportResolver {
	constructor(private readonly reportService: ReportService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Report)
	public async createReport(
		@Args('input') input: ReportInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Report> {
		console.log('Mutation: createReport');
		input.reportRefId = shapeIntoMongoObjectId(input.reportRefId);
		return await this.reportService.createReport(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Reports)
	public async getMyReports(
		@Args('input') input: ReportsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Reports> {
		console.log('Query: getMyReports');
		return await this.reportService.getMyReports(memberId, input);
	}

	/** ADMIN */

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Reports)
	public async getAllReportsByAdmin(@Args('input') input: AllReportsInquiry): Promise<Reports> {
		console.log('Query: getAllReportsByAdmin');
		return await this.reportService.getAllReportsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Report)
	public async updateReportByAdmin(@Args('input') input: ReportUpdate): Promise<Report> {
		console.log('Mutation: updateReportByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.reportService.updateReportByAdmin(input);
	}
}
