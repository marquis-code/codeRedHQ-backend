import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Staff, StaffDocument } from './schemas/staff.schema';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
export declare class StaffingService {
    private staffModel;
    private eventEmitter;
    constructor(staffModel: Model<StaffDocument>, eventEmitter: EventEmitter2);
    create(createStaffDto: CreateStaffDto): Promise<Staff>;
    findAll(hospitalId?: string, department?: string, availability?: string): Promise<Staff[]>;
    findOne(id: string): Promise<Staff>;
    update(id: string, updateStaffDto: UpdateStaffDto): Promise<Staff>;
    remove(id: string): Promise<void>;
    updateAvailability(id: string, availability: string): Promise<Staff>;
    getStaffSummary(hospitalId: string): Promise<any>;
}
