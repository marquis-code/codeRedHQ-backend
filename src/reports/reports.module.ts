import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Bedspace, BedspaceSchema } from '../bedspace/schemas/bedspace.schema';
import { EmergencyAlert, EmergencyAlertSchema } from '../emergency-alerts/schemas/emergency-alerts.schema';
import { Staff, StaffSchema } from '../staffing/schemas/staff.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bedspace.name, schema: BedspaceSchema },
      { name: EmergencyAlert.name, schema: EmergencyAlertSchema },
      { name: Staff.name, schema: StaffSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}