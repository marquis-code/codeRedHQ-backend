import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { Model, Types } from 'mongoose';
import { Request } from 'express';

import { AuditLog, AuditLogDocument } from './schemas/audit.schema';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    hospitalName?: string;
    [key: string]: any;
  };
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const createdAuditLog = new this.auditLogModel(createAuditLogDto);
    return createdAuditLog.save();
  }

  async findAll(
    hospitalId: string,
    query: any = {},
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, module, action, startDate, endDate, resourceId } = query;
    
    // Build filter
    const filter: any = { hospital: new MongooseSchema.Types.ObjectId(hospitalId) };
    
    if (module) {
      filter.module = module;
    }
    
    if (action) {
      filter.action = action;
    }
    
    if (resourceId) {
      filter.resourceId = resourceId;
    }
    
    // Date range
    if (startDate || endDate) {
      filter.createdAt = {};
      
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);
    
    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async findOne(id: string): Promise<AuditLog> {
    return this.auditLogModel.findById(id).exec();
  }
  

  async logActivity(
    hospitalId: string,
    module: string,
    action: string,
    resourceId: any,
    previousState: any = null,
    newState: any = null,
    req?: AuthenticatedRequest, // Use the extended interface here
  ): Promise<void> {
    const auditLog: CreateAuditLogDto = {
      hospital:  new Types.ObjectId(hospitalId),
      module,
      action,
      resourceId,
      previousState,
      newState,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
      performedBy: req?.user?.['hospitalName'] || 'System',
    };
    
    await this.create(auditLog);
  }

  async getActivitySummary(hospitalId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Aggregate activity by module and action
    const activityByModule = await this.auditLogModel.aggregate([
      {
        $match: {
          hospital: new MongooseSchema.Types.ObjectId(hospitalId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { module: '$module', action: '$action' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.module',
          actions: {
            $push: {
              action: '$_id.action',
              count: '$count',
            },
          },
          totalCount: { $sum: '$count' },
        },
      },
      {
        $project: {
          module: '$_id',
          actions: 1,
          totalCount: 1,
          _id: 0,
        },
      },
      {
        $sort: { totalCount: -1 },
      },
    ]).exec();
    
    // Aggregate activity by day
    const activityByDay = await this.auditLogModel.aggregate([
      {
        $match: {
          hospital: new MongooseSchema.Types.ObjectId(hospitalId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
            },
          },
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]).exec();
    
    return {
      activityByModule,
      activityByDay,
      totalActivities: await this.auditLogModel.countDocuments({
        hospital: new MongooseSchema.Types.ObjectId(hospitalId),
        createdAt: { $gte: startDate },
      }).exec(),
    };
  }
}