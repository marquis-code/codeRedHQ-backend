import { Model } from 'mongoose';
import { HospitalDocument } from '../hospital/schemas/hospital.schema';
import { BedspaceDocument } from '../bedspace/schemas/bedspace.schema';
export declare class MapService {
    private hospitalModel;
    private bedspaceModel;
    constructor(hospitalModel: Model<HospitalDocument>, bedspaceModel: Model<BedspaceDocument>);
    getNearbyHospitals(latitude: number, longitude: number, radius?: number): Promise<any[]>;
    getEmergencySurgePoints(): Promise<any[]>;
    getHospitalDensityHeatmap(): Promise<any[]>;
}
