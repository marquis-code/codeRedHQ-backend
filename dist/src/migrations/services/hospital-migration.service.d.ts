import { Model } from 'mongoose';
import { HospitalDocument } from '../../hospital/schemas/hospital.schema';
export declare class HospitalMigrationService {
    private hospitalModel;
    private readonly logger;
    constructor(hospitalModel: Model<HospitalDocument>);
    migrateLocations(): Promise<{
        success: boolean;
        message: string;
    }>;
}
