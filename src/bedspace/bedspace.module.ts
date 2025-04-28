import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { BedspaceController } from './bedspace.controller';
import { BedspaceService } from './bedspace.service';
import { Bedspace, BedspaceSchema } from './schemas/bedspace.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bedspace.name, schema: BedspaceSchema },
    ]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [BedspaceController],
  providers: [BedspaceService],
  exports: [BedspaceService],
})
export class BedspaceModule {}