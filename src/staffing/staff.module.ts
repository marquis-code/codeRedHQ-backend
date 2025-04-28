// staffing.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffingController } from './staff.controller';
import { StaffingService } from './staff.service';
import { Staff, StaffSchema } from './schemas/staff.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema }
    ])
  ],
  controllers: [StaffingController],
  providers: [StaffingService],
  exports: [StaffingService]
})
export class StaffingModule {}