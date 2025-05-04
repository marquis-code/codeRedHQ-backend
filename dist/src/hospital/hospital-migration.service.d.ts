import { Model } from 'mongoose';
import { HospitalDocument } from './schemas/hospital.schema';
export declare class HospitalMigrationService {
    private hospitalModel;
    constructor(hospitalModel: Model<HospitalDocument>);
    migrateLocations(): Promise<{
        success: boolean;
        message: string;
    }>;
}
