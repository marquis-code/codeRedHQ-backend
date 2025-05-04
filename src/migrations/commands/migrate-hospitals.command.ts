import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { HospitalMigrationService } from '../services/hospital-migration.service';

@Injectable()
@Command({
  name: 'migrate:hospitals:location',
  description: 'Migrate existing hospitals to add GeoJSON location field'
})
export class MigrateHospitalsCommand extends CommandRunner {
  constructor(private readonly migrationService: HospitalMigrationService) {
    super();
  }

  async run(): Promise<void> {
    console.log('🏥 Starting hospital location migration...');
    
    const result = await this.migrationService.migrateLocations();
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ ${result.message}`);
      process.exit(1);
    }
    
    // Exit the process after migration is complete
    process.exit(0);
  }
}