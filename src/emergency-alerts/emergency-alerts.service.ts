// import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import { Schema as MongooseSchema } from 'mongoose';

// import { EmergencyAlert, EmergencyAlertDocument } from './schemas/emergency-alerts.schema';
// import { CreateEmergencyAlertDto } from './dto/create-emergency-alert.dto';
// import { UpdateEmergencyAlertDto } from './dto/update-emergency-alert.dto';

// @Injectable()
// export class EmergencyAlertsService {
//   constructor(
//     @InjectModel(EmergencyAlert.name) private emergencyAlertModel: Model<EmergencyAlertDocument>,
//     private eventEmitter: EventEmitter2,
//   ) {}

//   async create(createEmergencyAlertDto: CreateEmergencyAlertDto): Promise<EmergencyAlert> {
//     // Create new emergency alert
//     const createdAlert = new this.emergencyAlertModel(createEmergencyAlertDto);
//     const savedAlert = await createdAlert.save();
    
//     // Emit event for emergency alert creation
//     this.eventEmitter.emit('emergency.created', {
//       hospitalId: savedAlert.hospital,
//       emergency: savedAlert,
//     });
    
//     return savedAlert;
//   }

//   async findAll(hospitalId?: string, status?: string): Promise<EmergencyAlert[]> {
//     // Build query
//     const query: any = {};
    
//     if (hospitalId) {
//       query.hospital = new Types.ObjectId(hospitalId);
//     }
    
//     if (status) {
//       query.status = status;
//     }
    
//     return this.emergencyAlertModel
//       .find(query)
//       .sort({ createdAt: -1 })
//       .exec();
//   }

//   async findOne(id: string): Promise<EmergencyAlert> {
//     const alert = await this.emergencyAlertModel.findById(id).exec();
    
//     if (!alert) {
//       throw new NotFoundException(`Emergency alert with ID ${id} not found`);
//     }
    
//     return alert;
//   }

//   async update(id: string, updateEmergencyAlertDto: UpdateEmergencyAlertDto): Promise<EmergencyAlert> {
//     // Find alert
//     const alert = await this.findOne(id);
    
//     // Update alert
//     const updatedAlert = await this.emergencyAlertModel
//       .findByIdAndUpdate(id, updateEmergencyAlertDto, { new: true })
//       .exec();
    
//     // Emit event for emergency alert update
//     this.eventEmitter.emit('emergency.updated', {
//       hospitalId: updatedAlert.hospital,
//       emergency: updatedAlert,
//     });
    
//     return updatedAlert;
//   }

//   async remove(id: string): Promise<void> {
//     // Find alert
//     const alert = await this.findOne(id);
    
//     // Delete alert
//     await this.emergencyAlertModel.findByIdAndDelete(id).exec();
    
//     // Emit event for emergency alert removal
//     this.eventEmitter.emit('emergency.removed', {
//       hospitalId: alert.hospital,
//       emergencyId: alert._id,
//     });
//   }

//   async resolveAlert(id: string, resolvedBy: string): Promise<EmergencyAlert> {
//     // Find alert
//     const alert = await this.findOne(id);
    
//     // Check if already resolved
//     if (alert.status === 'Resolved') {
//       throw new BadRequestException('Alert is already resolved');
//     }
    
//     // Update alert
//     alert.status = 'Resolved';
//     alert.resolvedBy = resolvedBy;
//     alert.resolvedAt = new Date();
//     alert.endTime = new Date();
    
//     const resolvedAlert = await alert.save();
    
//     // Emit event for emergency alert resolution
//     this.eventEmitter.emit('emergency.resolved', {
//       hospitalId: resolvedAlert.hospital,
//       emergency: resolvedAlert,
//     });
    
//     return resolvedAlert;
//   }

//   async getActiveAlertCount(hospitalId: string): Promise<number> {
//     return this.emergencyAlertModel.countDocuments({
//       hospital: new Types.ObjectId(hospitalId),
//       status: 'Active',
//     }).exec();
//   }

//   async getAlertsByType(hospitalId: string, startDate?: Date, endDate?: Date): Promise<any> {
//     // Build date range filter
//     const dateFilter: any = {};
    
//     if (startDate) {
//       dateFilter.createdAt = { $gte: startDate };
//     }
    
//     if (endDate) {
//       dateFilter.createdAt = { ...dateFilter.createdAt, $lte: endDate };
//     }
    
//     // Aggregate alerts by severity
//     return this.emergencyAlertModel.aggregate([
//       { 
//         $match: { 
//           hospital: new Types.ObjectId(hospitalId),
//           ...dateFilter
//         } 
//       },
//       {
//         $group: {
//           _id: '$severity',
//           count: { $sum: 1 },
//           alerts: { $push: '$$ROOT' }
//         }
//       },
//       {
//         $project: {
//           severity: '$_id',
//           count: 1,
//           alerts: 1,
//           _id: 0
//         }
//       }
//     ]).exec();
//   }
// }


import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Schema as MongooseSchema } from 'mongoose';

import { EmergencyAlert, EmergencyAlertDocument } from './schemas/emergency-alerts.schema';
import { CreateEmergencyAlertDto } from './dto/create-emergency-alert.dto';
import { UpdateEmergencyAlertDto } from './dto/update-emergency-alert.dto';

@Injectable()
export class EmergencyAlertsService {
  constructor(
    @InjectModel(EmergencyAlert.name) private emergencyAlertModel: Model<EmergencyAlertDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createEmergencyAlertDto: CreateEmergencyAlertDto): Promise<EmergencyAlertDocument> {
    // Create new emergency alert
    const createdAlert = new this.emergencyAlertModel(createEmergencyAlertDto);
    const savedAlert = await createdAlert.save();
    
    // Emit event for emergency alert creation
    this.eventEmitter.emit('emergency.created', {
      hospitalId: savedAlert.hospital,
      emergency: savedAlert,
    });
    
    return savedAlert;
  }

  async findAll(hospitalId?: string, status?: string): Promise<EmergencyAlertDocument[]> {
    // Build query
    const query: any = {};
    
    if (hospitalId) {
      query.hospital = new Types.ObjectId(hospitalId);
    }
    
    if (status) {
      query.status = status;
    }
    
    return this.emergencyAlertModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<EmergencyAlertDocument> {
    const alert = await this.emergencyAlertModel.findById(id).exec();
    
    if (!alert) {
      throw new NotFoundException(`Emergency alert with ID ${id} not found`);
    }
    
    return alert;
  }

  async update(id: string, updateEmergencyAlertDto: UpdateEmergencyAlertDto): Promise<EmergencyAlertDocument> {
    // Find alert
    const alert = await this.findOne(id);
    
    // Update alert
    const updatedAlert = await this.emergencyAlertModel
      .findByIdAndUpdate(id, updateEmergencyAlertDto, { new: true })
      .exec();
    
    // Emit event for emergency alert update
    this.eventEmitter.emit('emergency.updated', {
      hospitalId: updatedAlert.hospital,
      emergency: updatedAlert,
    });
    
    return updatedAlert;
  }

  async remove(id: string): Promise<void> {
    // Find alert
    const alert = await this.findOne(id);
    
    // Delete alert
    await this.emergencyAlertModel.findByIdAndDelete(id).exec();
    
    // Emit event for emergency alert removal
    this.eventEmitter.emit('emergency.removed', {
      hospitalId: alert.hospital,
      emergencyId: alert._id,
    });
  }

  async resolveAlert(id: string, resolvedBy: string): Promise<EmergencyAlertDocument> {
    // Find alert
    const alert = await this.findOne(id);
    
    // Check if already resolved
    if (alert.status === 'Resolved') {
      throw new BadRequestException('Alert is already resolved');
    }
    
    // Update alert
    alert.status = 'Resolved';
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date();
    alert.endTime = new Date();
    
    const resolvedAlert = await alert.save();
    
    // Emit event for emergency alert resolution
    this.eventEmitter.emit('emergency.resolved', {
      hospitalId: resolvedAlert.hospital,
      emergency: resolvedAlert,
    });
    
    return resolvedAlert;
  }

  async getActiveAlertCount(hospitalId: string): Promise<number> {
    return this.emergencyAlertModel.countDocuments({
      hospital: new Types.ObjectId(hospitalId),
      status: 'Active',
    }).exec();
  }

  async getAlertsByType(hospitalId: string, startDate?: Date, endDate?: Date): Promise<any> {
    // Build date range filter
    const dateFilter: any = {};
    
    if (startDate) {
      dateFilter.createdAt = { $gte: startDate };
    }
    
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, $lte: endDate };
    }
    
    // Aggregate alerts by severity
    return this.emergencyAlertModel.aggregate([
      { 
        $match: { 
          hospital: new Types.ObjectId(hospitalId),
          ...dateFilter
        } 
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
          alerts: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          severity: '$_id',
          count: 1,
          alerts: 1,
          _id: 0
        }
      }
    ]).exec();
  }
}