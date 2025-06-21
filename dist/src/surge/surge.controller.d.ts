import { SurgeService } from './surge.service';
export declare class SurgeController {
    private readonly surgeService;
    constructor(surgeService: SurgeService);
    createSurge(createSurgeDto: {
        hospitalId: string;
        latitude: number;
        longitude: number;
        address?: string;
        emergencyType?: string;
        description?: string;
        metadata?: Record<string, any>;
    }): Promise<import("./schema/surge.schema").Surge>;
    updateSurgeStatus(id: string, updateDto: {
        status: string;
        metadata?: Record<string, any>;
    }): Promise<import("./schema/surge.schema").Surge>;
    getSurgesByHospital(hospitalId: string, status?: string): Promise<import("./schema/surge.schema").Surge[]>;
    getSurgesInRegion(latString: string, lngString: string, radiusString: string, status?: string): Promise<import("./schema/surge.schema").Surge[]>;
    getSurgeById(id: string): Promise<import("./schema/surge.schema").Surge>;
}
