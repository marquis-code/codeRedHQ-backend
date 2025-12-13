import { Types } from 'mongoose';
export declare class RegisterStaffDto {
    hospital: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    position: string;
    department: string;
    contactNumber?: string;
    specializations?: Record<string, any>;
}
export declare class LoginStaffDto {
    email: string;
    password: string;
}
export declare class ClockInDto {
    latitude: number;
    longitude: number;
    shift: string;
    notes?: string;
}
export declare class ClockOutDto {
    latitude: number;
    longitude: number;
    notes?: string;
}
export declare class CreateStaffDto {
    hospital: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    position: string;
    department: string;
    availability?: string;
    contactNumber?: string;
    schedule?: Array<{
        date: Date;
        shift: string;
        status: string;
    }>;
    specializations?: Record<string, any>;
    permissions?: string[];
    emrAccessLevel?: string;
    isActive?: boolean;
    isVerified?: boolean;
}
export declare class UpdateStaffDto {
    name?: string;
    position?: string;
    department?: string;
    contactNumber?: string;
    specializations?: Record<string, any>;
    permissions?: string[];
    emrAccessLevel?: string;
    isActive?: boolean;
    isVerified?: boolean;
}
export declare class StaffUpdateBedspaceDto {
    availableBeds?: number;
    occupiedBeds?: number;
    notes?: string;
}
