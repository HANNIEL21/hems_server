import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityModule } from '../activity/activity.module';
import { EmergencyCasesService } from './emergency_cases.service';
import { EmergencyCasesController } from './emergency_cases.controller';
import {
  EmergencyCase,
  EmergencyCaseSchema,
} from './entities/emergency_case.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmergencyCase.name, schema: EmergencyCaseSchema },
    ]),
    ActivityModule,
  ],
  controllers: [EmergencyCasesController],
  providers: [EmergencyCasesService],
  exports: [EmergencyCasesService],
})
export class EmergencyCasesModule {}
