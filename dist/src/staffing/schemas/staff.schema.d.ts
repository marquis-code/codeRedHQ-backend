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
export type StaffDocument = Staff & Document;
export declare class Staff {
    hospital: MongooseSchema.Types.ObjectId;
    name: string;
    position: string;
    department: string;
    availability: string;
    contactNumber: string;
    email: string;
    schedule: Array<{
        date: Date;
        shift: string;
        status: string;
    }>;
    specializations: Record<string, any>;
    isActive: boolean;
}
export declare const StaffSchema: MongooseSchema<Document<Staff, any, any>, import("mongoose").Model<Document<Staff, any, any>, any, any, any, Document<unknown, any, Document<Staff, any, any>> & Document<Staff, any, any> & Required<{
    _id: Staff;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document<Staff, any, any>, Document<unknown, {}, import("mongoose").FlatRecord<Document<Staff, any, any>>> & import("mongoose").FlatRecord<Document<Staff, any, any>> & Required<{
    _id: Staff;
}>>;
