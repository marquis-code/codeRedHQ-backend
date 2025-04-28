import { StaffingService } from './staffing.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff } from './schemas/staff.schema';
export declare class StaffingController {
    private readonly staffingService;
    constructor(staffingService: StaffingService);
    create(createStaffDto: CreateStaffDto): Promise<Staff>;
    findAll(hospitalId?: string, department?: string, availability?: string): Promise<Staff[]>;
    findOne(id: string): Promise<Staff>;
    update(id: string, updateStaffDto: UpdateStaffDto): Promise<Staff>;
    remove(id: string): Promise<void>;
    updateAvailability(id: string, availability: string): Promise<Staff>;
    getStaffSummary(hospitalId: string): Promise<any>;
}
