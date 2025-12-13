// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Schema as MongooseSchema } from 'mongoose';
// import { Model, Types } from 'mongoose';
// import { Request } from 'express';

// import { AuditLog, AuditLogDocument } from './schemas/audit.schema';
// import { CreateAuditLogDto } from './dto/create-audit-log.dto';

// interface AuthenticatedRequest extends Request {
//   user?: {
//     hospitalName?: string;
//     [key: string]: any;
//   };
// }

// @Injectable()
// export class AuditService {
//   constructor(
//     @InjectModel(AuditLog.name)
//     private readonly auditLogModel: Model<AuditLogDocument>,
//   ) {}

//   async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
//     const createdAuditLog = new this.auditLogModel(createAuditLogDto);
//     return createdAuditLog.save();
//   }

//   async findAll(
//     hospitalId: string,
//     query: any = {},
//   ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
//     const { page = 1, limit = 20, module, action, startDate, endDate, resourceId } = query;
    
//     // Build filter
//     const filter: any = { hospital: new Types.ObjectId(hospitalId) };
    
//     if (module) {
//       filter.module = module;
//     }
    
//     if (action) {
//       filter.action = action;
//     }
    
//     if (resourceId) {
//       filter.resourceId = resourceId;
//     }
    
//     // Date range
//     if (startDate || endDate) {
//       filter.createdAt = {};
      
//       if (startDate) {
//         filter.createdAt.$gte = new Date(startDate);
//       }
      
//       if (endDate) {
//         filter.createdAt.$lte = new Date(endDate);
//       }
//     }
    
//     // Pagination
//     const skip = (page - 1) * limit;
    
//     // Execute query
//     const [data, total] = await Promise.all([
//       this.auditLogModel
//         .find(filter)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .exec(),
//       this.auditLogModel.countDocuments(filter).exec(),
//     ]);
    
//     return {
//       data,
//       total,
//       page: Number(page),
//       limit: Number(limit),
//     };
//   }

//   async findOne(id: string): Promise<AuditLog> {
//     return this.auditLogModel.findById(id).exec();
//   }
  

//   async logActivity(
//     hospitalId: string,
//     module: string,
//     action: string,
//     resourceId: any,
//     previousState: any = null,
//     newState: any = null,
//     req?: AuthenticatedRequest, // Use the extended interface here
//   ): Promise<void> {
//     const auditLog: CreateAuditLogDto = {
//       hospital:  new Types.ObjectId(hospitalId),
//       module,
//       action,
//       resourceId,
//       previousState,
//       newState,
//       ipAddress: req?.ip,
//       userAgent: req?.headers['user-agent'],
//       performedBy: req?.user?.['hospitalName'] || 'System',
//     };
    
//     await this.create(auditLog);
//   }

//   async getActivitySummary(hospitalId: string, days: number = 30): Promise<any> {
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - days);
    
//     // Aggregate activity by module and action
//     const activityByModule = await this.auditLogModel.aggregate([
//       {
//         $match: {
//           hospital: new Types.ObjectId(hospitalId),
//           createdAt: { $gte: startDate },
//         },
//       },
//       {
//         $group: {
//           _id: { module: '$module', action: '$action' },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $group: {
//           _id: '$_id.module',
//           actions: {
//             $push: {
//               action: '$_id.action',
//               count: '$count',
//             },
//           },
//           totalCount: { $sum: '$count' },
//         },
//       },
//       {
//         $project: {
//           module: '$_id',
//           actions: 1,
//           totalCount: 1,
//           _id: 0,
//         },
//       },
//       {
//         $sort: { totalCount: -1 },
//       },
//     ]).exec();
    
//     // Aggregate activity by day
//     const activityByDay = await this.auditLogModel.aggregate([
//       {
//         $match: {
//           hospital: new Types.ObjectId(hospitalId),
//           createdAt: { $gte: startDate },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             year: { $year: '$createdAt' },
//             month: { $month: '$createdAt' },
//             day: { $dayOfMonth: '$createdAt' },
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $project: {
//           date: {
//             $dateFromParts: {
//               year: '$_id.year',
//               month: '$_id.month',
//               day: '$_id.day',
//             },
//           },
//           count: 1,
//           _id: 0,
//         },
//       },
//       {
//         $sort: { date: 1 },
//       },
//     ]).exec();
    
//     return {
//       activityByModule,
//       activityByDay,
//       totalActivities: await this.auditLogModel.countDocuments({
//         hospital: new Types.ObjectId(hospitalId),
//         createdAt: { $gte: startDate },
//       }).exec(),
//     };
//   }
// }

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit.schema';

export interface CreateAuditLogDto {
  hospital: Types.ObjectId | string;
  staff: Types.ObjectId | string;
  action: string;
  resourceType: string;
  resourceId?: Types.ObjectId | string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  metadata?: Record<string, any>;
  notes?: string;
  location?: { latitude: number; longitude: number };
  status?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async createLog(logData: CreateAuditLogDto): Promise<AuditLogDocument> {
    const auditLog = new this.auditLogModel({
      ...logData,
      location: logData.location ? {
        type: 'Point',
        coordinates: [logData.location.longitude, logData.location.latitude],
      } : undefined,
    });

    return auditLog.save();
  }

  async getHospitalLogs(
    hospitalId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      action?: string;
      resourceType?: string;
      staffId?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<{ logs: AuditLogDocument[]; total: number }> {
    const query: any = { hospital: new Types.ObjectId(hospitalId) };

    if (options?.startDate || options?.endDate) {
      query.createdAt = {};
      if (options.startDate) query.createdAt.$gte = options.startDate;
      if (options.endDate) query.createdAt.$lte = options.endDate;
    }

    if (options?.action) {
      query.action = options.action;
    }

    if (options?.resourceType) {
      query.resourceType = options.resourceType;
    }

    if (options?.staffId) {
      query.staff = new Types.ObjectId(options.staffId);
    }

    const limit = options?.limit || 50;
    const skip = options?.skip || 0;

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .populate('staff', 'name email position department')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    return { logs, total };
  }

  async getResourceHistory(
    resourceType: string,
    resourceId: string
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({
        resourceType,
        resourceId: new Types.ObjectId(resourceId),
      })
      .populate('staff', 'name email position department')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getStaffActivity(
    staffId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditLogDocument[]> {
    const query: any = { staff: new Types.ObjectId(staffId) };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    return this.auditLogModel
      .find(query)
      .populate('hospital', 'hospitalName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getActivitySummary(hospitalId: string, startDate: Date, endDate: Date): Promise<any> {
    const result = await this.auditLogModel.aggregate([
      {
        $match: {
          hospital: new Types.ObjectId(hospitalId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            action: '$action',
            staff: '$staff',
          },
          count: { $sum: 1 },
          lastActivity: { $max: '$createdAt' },
        },
      },
      {
        $lookup: {
          from: 'staffs',
          localField: '_id.staff',
          foreignField: '_id',
          as: 'staffInfo',
        },
      },
      {
        $unwind: '$staffInfo',
      },
      {
        $group: {
          _id: '$_id.action',
          totalCount: { $sum: '$count' },
          staffActivities: {
            $push: {
              staffId: '$_id.staff',
              staffName: '$staffInfo.name',
              count: '$count',
              lastActivity: '$lastActivity',
            },
          },
        },
      },
      {
        $sort: { totalCount: -1 },
      },
    ]);

    return result;
  }
}