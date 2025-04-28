import { HospitalService } from './hospital.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { Hospital } from './schemas/hospital.schema';
export declare class HospitalController {
    private readonly hospitalService;
    constructor(hospitalService: HospitalService);
    create(createHospitalDto: CreateHospitalDto): Promise<Hospital>;
    findAll(query: any): Promise<Hospital[]>;
    findNearby(latitude: number, longitude: number, maxDistance?: number): Promise<Hospital[]>;
    findOne(id: string): Promise<Hospital>;
    update(id: string, updateHospitalDto: UpdateHospitalDto): Promise<Hospital>;
    remove(id: string): Promise<void>;
}
