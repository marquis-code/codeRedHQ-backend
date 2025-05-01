import { StaffingService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffDocument } from './schemas/staff.schema';
export declare class StaffingController {
    private readonly staffingService;
    constructor(staffingService: StaffingService);
    create(createStaffDto: CreateStaffDto): Promise<StaffDocument>;
    findAll(hospitalId?: string, department?: string, availability?: string): Promise<StaffDocument[]>;
    findOne(id: string): Promise<StaffDocument>;
    update(id: string, updateStaffDto: UpdateStaffDto): Promise<StaffDocument>;
    remove(id: string): Promise<void>;
    updateAvailability(id: string, availability: string): Promise<StaffDocument>;
    getStaffSummary(hospitalId: string): Promise<any>;
}
