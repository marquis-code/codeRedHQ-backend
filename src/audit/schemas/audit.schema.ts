// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Schema as MongooseSchema } from 'mongoose';

// export type AuditLogDocument = AuditLog & Document;

// @Schema({ timestamps: true })
// export class AuditLog {
//   @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
//   hospital: MongooseSchema.Types.ObjectId;

//   @Prop({ required: true })
//   action: string;

//   @Prop({ required: true })
//   module: string;

//   @Prop({ type: MongooseSchema.Types.Mixed })
//   resourceId: any;

//   @Prop({ type: MongooseSchema.Types.Mixed })
//   previousState: any;

//   @Prop({ type: MongooseSchema.Types.Mixed })
//   newState: any;

//   @Prop()
//   ipAddress: string;

//   @Prop()
//   userAgent: string;

//   @Prop()
//   performedBy: string;
// }

// export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// // Index for faster queries
// AuditLogSchema.index({ hospital: 1, createdAt: -1 });
// AuditLogSchema.index({ module: 1, action: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
  hospital: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Staff', required: true })
  staff: MongooseSchema.Types.ObjectId;

  @Prop({ 
    required: true,
    enum: ['bedspace_update', 'bedspace_create', 'bedspace_delete', 'emr_create', 'emr_update', 'emr_view', 'staff_create', 'staff_update', 'clock_in', 'clock_out']
  })
  action: string;

  @Prop({ required: true })
  resourceType: string; // 'Bedspace', 'EMR', 'Staff', etc.

  @Prop({ type: MongooseSchema.Types.ObjectId })
  resourceId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object })
  previousState: Record<string, any>;

  @Prop({ type: Object })
  newState: Record<string, any>;

  @Prop({ type: Object })
  metadata: Record<string, any>; // Additional context like IP, device info, etc.

  @Prop()
  notes: string;

  @Prop({ 
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ default: 'success' })
  status: string; // 'success', 'failed', 'pending'

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

    // Add timestamp fields
  createdAt?: Date;
  updatedAt?: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes for efficient querying
AuditLogSchema.index({ hospital: 1, createdAt: -1 });
AuditLogSchema.index({ staff: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });