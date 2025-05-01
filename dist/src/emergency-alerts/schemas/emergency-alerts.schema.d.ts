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
export type EmergencyAlertDocument = EmergencyAlert & Document;
export declare class EmergencyAlert {
    hospital: MongooseSchema.Types.ObjectId;
    title: string;
    description: string;
    severity: string;
    startTime: Date;
    endTime: Date;
    status: string;
    affectedDepartment: string;
    actions: string[];
    resolvedBy: string;
    resolvedAt: Date;
}
export declare const EmergencyAlertSchema: MongooseSchema<Document<EmergencyAlert, any, any>, import("mongoose").Model<Document<EmergencyAlert, any, any>, any, any, any, Document<unknown, any, Document<EmergencyAlert, any, any>> & Document<EmergencyAlert, any, any> & Required<{
    _id: EmergencyAlert;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document<EmergencyAlert, any, any>, Document<unknown, {}, import("mongoose").FlatRecord<Document<EmergencyAlert, any, any>>> & import("mongoose").FlatRecord<Document<EmergencyAlert, any, any>> & Required<{
    _id: EmergencyAlert;
}>>;
