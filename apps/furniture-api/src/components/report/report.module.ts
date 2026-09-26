import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportResolver } from './report.resolver';
import { ReportService } from './report.service';
import ReportSchema from '../../schemas/Report.model';
import MemberSchema from '../../schemas/Member.model';
import ProductSchema from '../../schemas/Product.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Report', schema: ReportSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Product', schema: ProductSchema },
			{ name: 'BoardArticle', schema: BoardArticleSchema },
		]),
		AuthModule,
		MemberModule,
	],
	providers: [ReportResolver, ReportService],
})
export class ReportModule {}
