import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { HospitalController } from './hospital.controller';
import { HospitalService } from './hospital.service';
import { Hospital, HospitalSchema } from './schemas/hospital.schema';
import { AuthModule } from 'src/auth/auth.module';
import { BedspaceModule } from 'src/bedspace/bedspace.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
    ]),
    forwardRef(() => BedspaceModule), // Handle circular dependency
    EventEmitterModule.forRoot(),
  ],
  controllers: [HospitalController],
  providers: [HospitalService],
  exports: [HospitalService],
})
export class HospitalModule {}