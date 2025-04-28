import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HospitalDocument } from './schemas/hospital.schema';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
export declare class HospitalService {
    private hospitalModel;
    private eventEmitter;
    constructor(hospitalModel: Model<HospitalDocument>, eventEmitter: EventEmitter2);
    create(createHospitalDto: CreateHospitalDto): Promise<HospitalDocument>;
    findAll(query?: any): Promise<HospitalDocument[]>;
    findOne(id: string): Promise<HospitalDocument>;
    update(id: string, updateHospitalDto: UpdateHospitalDto): Promise<HospitalDocument>;
    remove(id: string): Promise<void>;
    findNearby(latitude: number, longitude: number, maxDistance?: number): Promise<HospitalDocument[]>;
}
