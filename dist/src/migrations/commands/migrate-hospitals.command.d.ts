import { CommandRunner } from 'nest-commander';
import { HospitalMigrationService } from '../services/hospital-migration.service';
export declare class MigrateHospitalsCommand extends CommandRunner {
    private readonly migrationService;
    constructor(migrationService: HospitalMigrationService);
    run(): Promise<void>;
}
