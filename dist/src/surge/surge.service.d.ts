import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Surge, SurgeDocument } from './schema/surge.schema';
import { HospitalDocument } from '../hospital/schemas/hospital.schema';
export declare class SurgeService {
    private surgeModel;
    private hospitalModel;
    private eventEmitter;
    private readonly logger;
    constructor(surgeModel: Model<SurgeDocument>, hospitalModel: Model<HospitalDocument>, eventEmitter: EventEmitter2);
    createSurge(createSurgeDto: {
        hospitalId: string;
        latitude: number;
        longitude: number;
        address?: string;
        emergencyType?: string;
        description?: string;
        metadata?: Record<string, any>;
    }): Promise<Surge>;
    updateSurgeStatus(surgeId: string, status: string, metadata?: Record<string, any>): Promise<Surge>;
    getSurgesByHospital(hospitalId: string, status?: string[]): Promise<Surge[]>;
    getSurgeById(surgeId: string): Promise<Surge>;
    getSurgesInRegion(latitude: number, longitude: number, radiusInKm: number, status?: string[]): Promise<Surge[]>;
}
