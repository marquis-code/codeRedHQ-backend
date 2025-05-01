import { Types } from 'mongoose';
export declare class CreateStaffDto {
    hospital: Types.ObjectId;
    name: string;
    position: string;
    department: string;
    availability?: string;
    contactNumber?: string;
    email?: string;
    schedule?: Array<{
        date: Date;
        shift: string;
        status: string;
    }>;
    specializations?: Record<string, any>;
    isActive?: boolean;
}
