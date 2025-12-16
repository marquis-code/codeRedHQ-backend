import { Model } from 'mongoose';
import { Hospital, HospitalModel } from './schemas/hospital.schema';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { StaffingService } from '../staffing/staff.service';
export declare class HospitalService {
    private hospitalModel;
    private staffingService;
    constructor(hospitalModel: Model<HospitalModel>, staffingService: StaffingService);
    create(createHospitalDto: CreateHospitalDto): Promise<{
        hospital: Hospital;
        adminStaff: any;
        token: string;
    }>;
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
