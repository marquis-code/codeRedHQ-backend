

// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { Hospital, HospitalSchema } from './schemas/hospital.schema';
// import { HospitalService } from './hospital.service';
// import { HospitalController } from './hospital.controller';

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       { 
//         name: Hospital.name, 
//         schema: HospitalSchema,
//         // Add collection options for better performance
//         collection: 'hospitals'
//       },
//     ]),
//   ],
//   controllers: [HospitalController],
//   providers: [HospitalService],
//   exports: [HospitalService, MongooseModule],
// })
// export class HospitalModule {}

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Hospital, HospitalSchema } from './schemas/hospital.schema';
import { HospitalService } from './hospital.service';
import { HospitalController } from './hospital.controller';
import { StaffingModule } from '../staffing/staff.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: Hospital.name, 
        schema: HospitalSchema,
        collection: 'hospitals'
      },
    ]),
    forwardRef(() => StaffingModule), // ✅ Add this
  ],
  controllers: [HospitalController],
  providers: [HospitalService],
  exports: [HospitalService, MongooseModule],
})
export class HospitalModule {}
