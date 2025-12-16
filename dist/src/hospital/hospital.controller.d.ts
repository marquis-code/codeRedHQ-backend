import { HospitalService } from './hospital.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { Hospital } from './schemas/hospital.schema';
export declare class HospitalController {
    private readonly hospitalService;
    constructor(hospitalService: HospitalService);
    create(createHospitalDto: CreateHospitalDto): Promise<{
        success: boolean;
        message: string;
        data: {
            hospital: {
                id: import("mongoose").Schema.Types.ObjectId;
                hospitalName: string;
                email: string;
                username: string;
                address: string;
            };
            admin: {
                id: any;
                name: any;
                email: any;
                position: any;
                department: any;
                permissions: any;
                emrAccessLevel: any;
            };
            token: string;
        };
    }>;
    findAll(query: any): Promise<Hospital[]>;
    findNearby(latitude: number, longitude: number, maxDistance?: number): Promise<Hospital[]>;
    findOne(id: string): Promise<Hospital>;
    update(id: string, updateHospitalDto: UpdateHospitalDto): Promise<Hospital>;
    remove(id: string): Promise<void>;
}
