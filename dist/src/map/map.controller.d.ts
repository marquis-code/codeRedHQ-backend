import { MapService } from './map.service';
export declare class MapController {
    private readonly mapService;
    constructor(mapService: MapService);
    getNearbyHospitals(latitude: number, longitude: number, radius: number): Promise<any[]>;
    getEmergencySurgePoints(): Promise<any[]>;
    getHospitalDensityHeatmap(): Promise<any[]>;
}
