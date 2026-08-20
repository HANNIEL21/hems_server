import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityModule } from '../activity/activity.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmergencyCasesService } from './emergency_cases.service';
import { EmergencyCasesController } from './emergency_cases.controller';
import {
  EmergencyCase,
  EmergencyCaseSchema,
} from './entities/emergency_case.entity';
import {
  Incident,
  IncidentSchema,
} from '../incidents/entities/incident.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmergencyCase.name, schema: EmergencyCaseSchema },
      { name: Incident.name, schema: IncidentSchema },
    ]),
    ActivityModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [EmergencyCasesController],
  providers: [EmergencyCasesService],
  exports: [EmergencyCasesService],
})
export class EmergencyCasesModule {}
