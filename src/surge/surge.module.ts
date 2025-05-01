import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Surge, SurgeSchema } from './schema/surge.schema';
import { SurgeService } from './surge.service';
import { SurgeController } from './surge.controller';
import { Hospital, HospitalSchema } from '../hospital/schemas/hospital.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Surge.name, schema: SurgeSchema },
      { name: Hospital.name, schema: HospitalSchema },
    ]),
  ],
  controllers: [SurgeController],
  providers: [SurgeService],
  exports: [SurgeService],
})
export class SurgeModule {}