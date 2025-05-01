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
import { Types } from 'mongoose';
export interface BedspaceDocument extends Document, Bedspace {
}
export declare class Bedspace {
    hospital: Types.ObjectId;
    departmentName: string;
    location: string;
    totalBeds: number;
    availableBeds: number;
    occupiedBeds: number;
    lastUpdated: Date;
    status: string;
    history: Array<{
        date: Date;
        available: number;
        occupied: number;
    }>;
}
export declare const BedspaceSchema: MongooseSchema<Document<Bedspace, any, any>, import("mongoose").Model<Document<Bedspace, any, any>, any, any, any, Document<unknown, any, Document<Bedspace, any, any>> & Document<Bedspace, any, any> & Required<{
    _id: Bedspace;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document<Bedspace, any, any>, Document<unknown, {}, import("mongoose").FlatRecord<Document<Bedspace, any, any>>> & import("mongoose").FlatRecord<Document<Bedspace, any, any>> & Required<{
    _id: Bedspace;
}>>;
