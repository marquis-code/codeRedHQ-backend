// import { Module, forwardRef } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { EventEmitterModule } from '@nestjs/event-emitter';
// import { AuditModule } from '../audit/audit.module';

// import { BedspaceController } from './bedspace.controller';
// import { BedspaceService } from './bedspace.service';
// import { Bedspace, BedspaceSchema } from './schemas/bedspace.schema';
// import { HospitalModule } from '../hospital/hospital.module';

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       { name: Bedspace.name, schema: BedspaceSchema },
//     ]),
//     HospitalModule,
//     // forwardRef(() => HospitalModule), // Handle circular dependency
//     EventEmitterModule.forRoot(),
//     AuditModule,
//   ],
//   controllers: [BedspaceController],
//   providers: [BedspaceService],
//   exports: [BedspaceService],
// })
// export class BedspaceModule { }

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuditModule } from '../audit/audit.module';

import { BedspaceController } from './bedspace.controller';
import { BedspaceService } from './bedspace.service';
import { Bedspace, BedspaceSchema } from './schemas/bedspace.schema';
import { HospitalModule } from '../hospital/hospital.module';
import { Staff, StaffSchema } from '../staffing/schemas/staff.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bedspace.name, schema: BedspaceSchema },
      { name: Staff.name, schema: StaffSchema }, // Add Staff schema
    ]),
    HospitalModule,
    EventEmitterModule.forRoot(),
    AuditModule,
  ],
  controllers: [BedspaceController],
  providers: [BedspaceService],
  exports: [BedspaceService, MongooseModule], // Export MongooseModule if other modules need it
})
export class BedspaceModule { }