import { Model } from 'mongoose';
import { Hospital, HospitalModel } from './schemas/hospital.schema';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
export declare class HospitalService {
    private hospitalModel;
    constructor(hospitalModel: Model<HospitalModel>);
    create(createHospitalDto: CreateHospitalDto): Promise<Hospital>;
    findAll(query: any): Promise<Hospital[]>;
    findOne(id: string): Promise<Hospital>;
    findByUsernameOrEmail(usernameOrEmail: string): Promise<Hospital>;
    update(id: string, updateHospitalDto: UpdateHospitalDto): Promise<Hospital>;
    remove(id: string): Promise<void>;
    private generateUniqueUsername;
    validateHospital(usernameOrEmail: string, password: string): Promise<Hospital | null>;
}
