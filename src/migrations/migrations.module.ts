import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Hospital, HospitalSchema } from '../hospital/schemas/hospital.schema';
import { HospitalMigrationService } from './services/hospital-migration.service';
import { MigrateHospitalsCommand } from './commands/migrate-hospitals.command';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
    ]),
  ],
  providers: [HospitalMigrationService, MigrateHospitalsCommand],
  exports: [HospitalMigrationService],
})
export class MigrationsModule {}