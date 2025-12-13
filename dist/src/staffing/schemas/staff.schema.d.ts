/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
import { Document, Schema as MongooseSchema } from 'mongoose';
export interface StaffMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export type StaffDocument = Staff & Document & StaffMethods;
export declare class Staff {
    hospital: MongooseSchema.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    position: string;
    department: string;
    availability: string;
    contactNumber: string;
    schedule: Array<{
        date: Date;
        shift: string;
        status: string;
    }>;
    specializations: Record<string, any>;
    attendanceHistory: Array<{
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
        status: 'active' | 'completed';
        notes?: string;
    }>;
    currentShift: {
        clockInTime: Date;
        clockInLocation: {
            type: string;
            coordinates: number[];
        };
        distanceFromHospital: number;
        shift: string;
    } | null;
    permissions: string[];
    emrAccessLevel: string;
    isActive: boolean;
    isVerified: boolean;
    lastKnownLocation: {
        type: string;
        coordinates: number[];
    };
    lastLocationUpdate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const StaffSchema: MongooseSchema<Document<Staff, any, any>, import("mongoose").Model<Document<Staff, any, any>, any, any, any, Document<unknown, any, Document<Staff, any, any>> & Document<Staff, any, any> & Required<{
    _id: Staff;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document<Staff, any, any>, Document<unknown, {}, import("mongoose").FlatRecord<Document<Staff, any, any>>> & import("mongoose").FlatRecord<Document<Staff, any, any>> & Required<{
    _id: Staff;
}>>;
