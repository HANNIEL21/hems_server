import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import {
  EmergencyCase,
  EmergencyCaseSchema,
} from '../emergency_cases/entities/emergency_case.entity';
import {
  Incident,
  IncidentSchema,
} from '../incidents/entities/incident.entity';
import { User, UserSchema } from '../users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmergencyCase.name, schema: EmergencyCaseSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
