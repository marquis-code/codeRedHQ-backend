import { Module } from "@nestjs/common";
import { MongooseModule } from '@nestjs/mongoose';
import { MapService } from "./map.service";
import { Hospital, HospitalSchema } from '../hospital/schemas/hospital.schema';
import { Bedspace, BedspaceSchema } from '../bedspace/schemas/bedspace.schema'; // Adjust path as needed

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
      { name: Bedspace.name, schema: BedspaceSchema }
    ])
  ],
  controllers: [],
  providers: [MapService],
  exports: [MapService]
})
export class MapModule {}