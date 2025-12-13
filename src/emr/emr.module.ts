import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EMRController } from './emr.controller';
import { EMRService } from './emr.service';
import { Patient, PatientSchema } from './schemas/emr.schema';
import { MedicalVisit, MedicalVisitSchema } from './schemas/emr.schema';
import { SurgeData, SurgeDataSchema } from './schemas/emr.schema';
import { Staff, StaffSchema } from '../staffing/schemas/staff.schema';
import { Bedspace, BedspaceSchema } from 'src/bedspace/schemas/bedspace.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: MedicalVisit.name, schema: MedicalVisitSchema },
      { name: SurgeData.name, schema: SurgeDataSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: Bedspace.name, schema: BedspaceSchema },
    ]),
    AuditModule,
  ],
  controllers: [EMRController],
  providers: [EMRService],
  exports: [EMRService],
})
export class EMRModule {}
