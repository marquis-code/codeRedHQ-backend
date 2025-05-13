import { Model } from 'mongoose';
import { Hospital, HospitalModel } from './schemas/hospital.schema';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
export declare class HospitalService {
    private hospitalModel;
    constructor(hospitalModel: Model<HospitalModel>);
    create(createHospitalDto: CreateHospitalDto): Promise<Hospital>;
    findAll(query: any): Promise<Hospital[]>;
    findByUsernameOrEmail(usernameOrEmail: string): Promise<Hospital>;
    update(id: string, updateHospitalDto: UpdateHospitalDto): Promise<Hospital>;
    remove(id: string): Promise<void>;
    findNearby(latitude: number, longitude: number, maxDistance?: number): Promise<Hospital[]>;
    findNearbyAggregation(latitude: number, longitude: number, maxDistance?: number): Promise<Hospital[]>;
    verifyLocationIndex(hospitalId: string): Promise<any>;
    findByExactCoordinates(latitude: number, longitude: number): Promise<Hospital[]>;
    private generateUniqueUsername;
    validateHospital(usernameOrEmail: string, password: string): Promise<Hospital | null>;
    updateHospitalBedspaceSummary(hospitalId: string): Promise<Hospital>;
    findOne(id: string): Promise<Hospital>;
}
