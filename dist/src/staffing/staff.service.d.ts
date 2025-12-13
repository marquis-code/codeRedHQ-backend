import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StaffDocument } from '../staffing/schemas/staff.schema';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { HospitalDocument } from '../hospital/schemas/hospital.schema';
import { RegisterStaffDto, LoginStaffDto, ClockInDto, ClockOutDto, CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';
export declare class StaffingService {
    private staffModel;
    private hospitalModel;
    private eventEmitter;
    private jwtService;
    private configService;
    private readonly MAX_CLOCK_IN_DISTANCE;
    constructor(staffModel: Model<StaffDocument>, hospitalModel: Model<HospitalDocument>, eventEmitter: EventEmitter2, jwtService: JwtService, configService: ConfigService);
    private calculateDistance;
    register(registerStaffDto: RegisterStaffDto): Promise<{
        staff: StaffDocument;
        token: string;
    }>;
    login(loginStaffDto: LoginStaffDto): Promise<{
        staff: StaffDocument;
        token: string;
    }>;
    clockIn(staffId: string, clockInDto: ClockInDto): Promise<StaffDocument>;
    clockOut(staffId: string, clockOutDto: ClockOutDto): Promise<StaffDocument>;
    getAttendanceHistory(staffId: string, startDate?: Date, endDate?: Date): Promise<any>;
    verifyStaff(staffId: string, permissions?: string[], emrAccessLevel?: string): Promise<StaffDocument>;
    checkPermission(staffId: string, permission: string): Promise<boolean>;
    create(createStaffDto: CreateStaffDto): Promise<StaffDocument>;
    bootstrapAdmin(dto: BootstrapAdminDto, secretFromHeader: string): Promise<{
        staff: StaffDocument;
        token: string;
    }>;
    findAll(hospitalId?: string, department?: string, availability?: string): Promise<StaffDocument[]>;
    findOne(id: string): Promise<StaffDocument>;
    update(id: string, updateStaffDto: UpdateStaffDto): Promise<StaffDocument>;
    remove(id: string): Promise<void>;
    updateAvailability(id: string, availability: string): Promise<StaffDocument>;
    getStaffSummary(hospitalId: string): Promise<any>;
}
