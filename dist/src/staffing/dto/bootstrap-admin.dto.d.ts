import { Types } from 'mongoose';
export declare class BootstrapAdminDto {
    hospital: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    position: string;
    department: string;
    contactNumber?: string;
}
