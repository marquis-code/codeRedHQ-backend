// import { Module, OnModuleInit } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { Hospital, HospitalSchema } from './schemas/hospital.schema';
// import { HospitalService } from './hospital.service';
// import { HospitalController } from './hospital.controller';
// import mongoose from 'mongoose';

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       { name: Hospital.name, schema: HospitalSchema },
//     ]),
//   ],
//   controllers: [HospitalController],
//   providers: [HospitalService],
//   exports: [HospitalService, MongooseModule],
// })
// export class HospitalModule implements OnModuleInit {
//   async onModuleInit() {
//     // Ensure the Hospital model is registered globally
//     if (!mongoose.modelNames().includes('Hospital')) {
//       try {
//         mongoose.model('Hospital', HospitalSchema);
//         console.log('Hospital model registered globally in HospitalModule');
//       } catch (error) {
//         console.error('Error registering Hospital model in HospitalModule:', error.message);
//       }
//     }
//   }
// }

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Hospital, HospitalSchema } from './schemas/hospital.schema';
import { HospitalService } from './hospital.service';
import { HospitalController } from './hospital.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: Hospital.name, 
        schema: HospitalSchema,
        // Add collection options for better performance
        collection: 'hospitals'
      },
    ]),
  ],
  controllers: [HospitalController],
  providers: [HospitalService],
  exports: [HospitalService, MongooseModule],
})
export class HospitalModule {}