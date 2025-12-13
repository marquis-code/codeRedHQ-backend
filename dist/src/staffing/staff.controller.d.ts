import { StaffingService } from './staff.service';
import { RegisterStaffDto, LoginStaffDto, ClockInDto, ClockOutDto, CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';
import { BootstrapAdminDto } from "./dto/bootstrap-admin.dto";
export declare class StaffingController {
    private readonly staffingService;
    constructor(staffingService: StaffingService);
    register(registerDto: RegisterStaffDto): Promise<{
        success: boolean;
        message: string;
        data: {
            staff: {
                id: any;
                name: string;
                email: string;
                position: string;
                department: string;
                hospital: import("mongoose").Schema.Types.ObjectId;
                isVerified: boolean;
                isActive: boolean;
            };
            token: string;
        };
    }>;
    bootstrapAdmin(dto: BootstrapAdminDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            staff: {
                id: any;
                name: string;
                email: string;
                hospital: import("mongoose").Schema.Types.ObjectId;
                permissions: string[];
                emrAccessLevel: string;
                isVerified: boolean;
                isActive: boolean;
            };
            token: string;
        };
    }>;
    login(loginDto: LoginStaffDto): Promise<{
        success: boolean;
        message: string;
        data: {
            staff: {
                id: any;
                name: string;
                email: string;
                position: string;
                department: string;
                hospital: import("mongoose").Schema.Types.ObjectId;
                permissions: string[];
                emrAccessLevel: string;
                availability: string;
                isVerified: boolean;
                isActive: boolean;
            };
            token: string;
        };
    }>;
    clockIn(clockInDto: ClockInDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            staffId: any;
            name: string;
            clockInTime: Date;
            shift: string;
            availability: string;
            distanceFromHospital: number;
            location: {
                type: string;
                coordinates: number[];
            };
        };
    }>;
    clockOut(clockOutDto: ClockOutDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            staffId: any;
            name: string;
            availability: string;
            lastShift: {
                durationHours: number;
                clockInTime: Date;
                clockOutTime?: Date;
                clockInLocation: {
                    type: string;
                    coordinates: number[];
                };
                clockOutLocation?: {
                    type: string;
                    coordinates: number[];
                };
                distanceFromHospital: number;
                shift: string;
                status: "completed" | "active";
                notes?: string;
            };
        };
    }>;
    getAttendanceHistory(req: any, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getProfile(req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    create(createStaffDto: CreateStaffDto): Promise<{
        success: boolean;
        message: string;
        data: import("./schemas/staff.schema").StaffDocument;
    }>;
    verifyStaff(id: string, body: {
        permissions?: string[];
        emrAccessLevel?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: import("./schemas/staff.schema").StaffDocument;
    }>;
    findAll(hospitalId?: string, department?: string, availability?: string): Promise<{
        success: boolean;
        message: string;
        data: import("./schemas/staff.schema").StaffDocument[];
    }>;
    getStaffSummary(hospitalId: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    update(id: string, updateStaffDto: UpdateStaffDto): Promise<{
        success: boolean;
        message: string;
        data: import("./schemas/staff.schema").StaffDocument;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateAvailability(id: string, availability: string): Promise<{
        success: boolean;
        message: string;
        data: {
            staffId: any;
            name: string;
            availability: string;
        };
    }>;
}
