import { Module,forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { BedspaceController } from './bedspace.controller';
import { BedspaceService } from './bedspace.service';
import { Bedspace, BedspaceSchema } from './schemas/bedspace.schema';
import { HospitalModule } from '../hospital/hospital.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bedspace.name, schema: BedspaceSchema },
    ]),
    HospitalModule,
    // forwardRef(() => HospitalModule), // Handle circular dependency
    EventEmitterModule.forRoot(),
  ],
  controllers: [BedspaceController],
  providers: [BedspaceService],
  exports: [BedspaceService],
})
export class BedspaceModule {}