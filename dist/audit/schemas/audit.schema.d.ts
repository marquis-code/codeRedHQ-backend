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
export type AuditLogDocument = AuditLog & Document;
export declare class AuditLog {
    hospital: MongooseSchema.Types.ObjectId;
    action: string;
    module: string;
    resourceId: any;
    previousState: any;
    newState: any;
    ipAddress: string;
    userAgent: string;
    performedBy: string;
}
export declare const AuditLogSchema: MongooseSchema<Document<AuditLog, any, any>, import("mongoose").Model<Document<AuditLog, any, any>, any, any, any, Document<unknown, any, Document<AuditLog, any, any>> & Document<AuditLog, any, any> & Required<{
    _id: AuditLog;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document<AuditLog, any, any>, Document<unknown, {}, import("mongoose").FlatRecord<Document<AuditLog, any, any>>> & import("mongoose").FlatRecord<Document<AuditLog, any, any>> & Required<{
    _id: AuditLog;
}>>;
