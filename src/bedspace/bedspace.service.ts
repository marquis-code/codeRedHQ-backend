import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Bedspace, BedspaceDocument } from './schemas/bedspace.schema';
import { Staff, StaffDocument } from '../staffing/schemas/staff.schema';
import { CreateBedspaceDto } from './dto/create-bedspace.dto';
import { UpdateBedspaceDto } from './dto/update-bedspace.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BedspaceService {
  constructor(
    @InjectModel(Bedspace.name) private bedspaceModel: Model<BedspaceDocument>,
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
    private eventEmitter: EventEmitter2,
    private auditLogService: AuditService,
  ) {}

  async create(createBedspaceDto: CreateBedspaceDto): Promise<BedspaceDocument> {
    if (createBedspaceDto.availableBeds + createBedspaceDto.occupiedBeds !== createBedspaceDto.totalBeds) {
      throw new BadRequestException('Available beds + occupied beds must equal total beds');
    }
    
    const createdBedspace = new this.bedspaceModel(createBedspaceDto);
    const savedBedspace = await createdBedspace.save();
    
    this.eventEmitter.emit('bedspace.created', {
      hospitalId: savedBedspace.hospital,
      bedspace: savedBedspace,
    });
    
    return savedBedspace;
  }

  async findAllBedspaces(hospitalId?: string): Promise<BedspaceDocument[]> {
    const query = hospitalId ? { hospital: new Types.ObjectId(hospitalId) } : {};
    return this.bedspaceModel.find(query).exec();
  }

  async findOne(id: string): Promise<BedspaceDocument> {
    const bedspace = await this.bedspaceModel.findById(id).exec();
    
    if (!bedspace) {
      throw new NotFoundException(`Bedspace with ID ${id} not found`);
    }
    
    return bedspace;
  }

  // Staff-managed bedspace update with audit trail
  async updateByStaff(
    bedspaceId: string,
    staffId: string,
    updateData: {
      availableBeds?: number;
      occupiedBeds?: number;
      notes?: string;
    },
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      location?: { latitude: number; longitude: number };
    }
  ): Promise<BedspaceDocument> {
    // Verify staff exists and has permission
    const staff = await this.staffModel.findById(staffId);
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    if (!staff.isVerified || !staff.isActive) {
      throw new ForbiddenException('Your account is not authorized to update bedspace');
    }

    if (!staff.permissions.includes('manage_bedspace')) {
      throw new ForbiddenException('You do not have permission to manage bedspace');
    }

    // Get current bedspace state
    const bedspace = await this.findOne(bedspaceId);

    // Verify staff belongs to the same hospital
    if (bedspace.hospital.toString() !== staff.hospital.toString()) {
      throw new ForbiddenException('You can only update bedspaces in your own hospital');
    }

    // Store previous state for audit
    const previousState = {
      availableBeds: bedspace.availableBeds,
      occupiedBeds: bedspace.occupiedBeds,
      totalBeds: bedspace.totalBeds,
      status: bedspace.status,
    };

    // Calculate new values
    let newAvailable = updateData.availableBeds ?? bedspace.availableBeds;
    let newOccupied = updateData.occupiedBeds ?? bedspace.occupiedBeds;

    // Validate the update
    if (newAvailable + newOccupied !== bedspace.totalBeds) {
      throw new BadRequestException(
        `Invalid update: Available (${newAvailable}) + Occupied (${newOccupied}) must equal Total (${bedspace.totalBeds})`
      );
    }

    if (newAvailable < 0 || newOccupied < 0) {
      throw new BadRequestException('Bed counts cannot be negative');
    }

    // Update bedspace
    bedspace.availableBeds = newAvailable;
    bedspace.occupiedBeds = newOccupied;
    const updatedBedspace = await bedspace.save();

    // Create audit log
    await this.auditLogService.createLog({
      hospital: bedspace.hospital,
      staff: staff._id,
      action: 'bedspace_update',
      resourceType: 'Bedspace',
      resourceId: bedspace._id,
      previousState,
      newState: {
        availableBeds: updatedBedspace.availableBeds,
        occupiedBeds: updatedBedspace.occupiedBeds,
        totalBeds: updatedBedspace.totalBeds,
        status: updatedBedspace.status,
      },
      metadata: {
        ...metadata,
        staffName: staff.name,
        staffPosition: staff.position,
        department: staff.department,
      },
      notes: updateData.notes,
      location: metadata?.location,
      status: 'success',
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    // Emit event
    this.eventEmitter.emit('bedspace.updated', {
      hospitalId: updatedBedspace.hospital,
      bedspace: updatedBedspace,
      updatedBy: staff._id,
    });

    return updatedBedspace;
  }

  // Admit patient (decrease available beds)
  async admitPatient(
    bedspaceId: string,
    staffId: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      location?: { latitude: number; longitude: number };
      notes?: string;
    }
  ): Promise<BedspaceDocument> {
    const bedspace = await this.findOne(bedspaceId);

    if (bedspace.availableBeds <= 0) {
      throw new BadRequestException('No available beds for admission');
    }

    return this.updateByStaff(
      bedspaceId,
      staffId,
      {
        availableBeds: bedspace.availableBeds - 1,
        occupiedBeds: bedspace.occupiedBeds + 1,
        notes: metadata?.notes || 'Patient admitted',
      },
      metadata
    );
  }

  // Discharge patient (increase available beds)
  async dischargePatient(
    bedspaceId: string,
    staffId: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      location?: { latitude: number; longitude: number };
      notes?: string;
    }
  ): Promise<BedspaceDocument> {
    const bedspace = await this.findOne(bedspaceId);

    if (bedspace.occupiedBeds <= 0) {
      throw new BadRequestException('No occupied beds to discharge');
    }

    return this.updateByStaff(
      bedspaceId,
      staffId,
      {
        availableBeds: bedspace.availableBeds + 1,
        occupiedBeds: bedspace.occupiedBeds - 1,
        notes: metadata?.notes || 'Patient discharged',
      },
      metadata
    );
  }

  // Get bedspace update history
  async getBedspaceHistory(bedspaceId: string): Promise<any> {
    const bedspace = await this.findOne(bedspaceId);
    const auditLogs = await this.auditLogService.getResourceHistory('Bedspace', bedspaceId);

    return {
      bedspace: {
        id: bedspace._id,
        departmentName: bedspace.departmentName,
        location: bedspace.location,
        currentState: {
          totalBeds: bedspace.totalBeds,
          availableBeds: bedspace.availableBeds,
          occupiedBeds: bedspace.occupiedBeds,
          status: bedspace.status,
        },
      },
      history: auditLogs.map(log => ({
        timestamp: log.createdAt,
        staff: log.staff,
        action: log.action,
        previousState: log.previousState,
        newState: log.newState,
        notes: log.notes,
        location: log.location,
      })),
    };
  }

  // Original methods
  async update(id: string, updateBedspaceDto: UpdateBedspaceDto): Promise<BedspaceDocument> {
    const bedspace = await this.findOne(id);
    
    if (
      updateBedspaceDto.availableBeds !== undefined && 
      updateBedspaceDto.occupiedBeds !== undefined &&
      updateBedspaceDto.totalBeds !== undefined
    ) {
      if (updateBedspaceDto.availableBeds + updateBedspaceDto.occupiedBeds !== updateBedspaceDto.totalBeds) {
        throw new BadRequestException('Available beds + occupied beds must equal total beds');
      }
    } else if (
      updateBedspaceDto.availableBeds !== undefined && 
      updateBedspaceDto.occupiedBeds !== undefined
    ) {
      updateBedspaceDto.totalBeds = updateBedspaceDto.availableBeds + updateBedspaceDto.occupiedBeds;
    } else if (updateBedspaceDto.availableBeds !== undefined) {
      const currentOccupied = bedspace.occupiedBeds;
      const newTotal = updateBedspaceDto.totalBeds || bedspace.totalBeds;
      updateBedspaceDto.occupiedBeds = newTotal - updateBedspaceDto.availableBeds;
    } else if (updateBedspaceDto.occupiedBeds !== undefined) {
      const newTotal = updateBedspaceDto.totalBeds || bedspace.totalBeds;
      updateBedspaceDto.availableBeds = newTotal - updateBedspaceDto.occupiedBeds;
    }
    
    const updatedBedspace = await this.bedspaceModel
      .findByIdAndUpdate(id, updateBedspaceDto, { new: true })
      .exec();
    
    this.eventEmitter.emit('bedspace.updated', {
      hospitalId: updatedBedspace.hospital,
      bedspace: updatedBedspace,
    });
    
    return updatedBedspace;
  }

  async remove(id: string): Promise<void> {
    const bedspace = await this.findOne(id);
    
    await this.bedspaceModel.findByIdAndDelete(id).exec();
    
    this.eventEmitter.emit('bedspace.removed', {
      hospitalId: bedspace.hospital,
      bedspaceId: bedspace._id,
    });
  }

  async getHospitalSummary(hospitalId: string): Promise<any> {
    try {
      new Types.ObjectId(hospitalId);
    } catch (error) {
      throw new BadRequestException('Invalid hospital ID');
    }
    
    const aggregationResult = await this.bedspaceModel.aggregate([
      { $match: { hospital: new Types.ObjectId(hospitalId) } },
      { $group: {
          _id: null,
          totalBeds: { $sum: '$totalBeds' },
          availableBeds: { $sum: '$availableBeds' },
          occupiedBeds: { $sum: '$occupiedBeds' },
          departments: { $push: {
            name: '$departmentName',
            location: '$location',
            totalBeds: '$totalBeds',
            availableBeds: '$availableBeds',
            occupiedBeds: '$occupiedBeds',
            status: '$status',
            lastUpdated: '$lastUpdated'
          }}
        }
      }
    ]).exec();
    
    if (!aggregationResult.length) {
      return {
        totalBeds: 0,
        availableBeds: 0,
        occupiedBeds: 0,
        occupancyRate: 0,
        departments: []
      };
    }
    
    const result = aggregationResult[0];
    const occupancyRate = result.totalBeds > 0 
      ? Math.round((result.occupiedBeds / result.totalBeds) * 100) 
      : 0;
    
    return {
      totalBeds: result.totalBeds,
      availableBeds: result.availableBeds,
      occupiedBeds: result.occupiedBeds,
      occupancyRate,
      departments: result.departments
    };
  }

  async updateBedAvailability(id: string, increment: boolean): Promise<BedspaceDocument> {
    const bedspace = await this.findOne(id);
    
    if (increment) {
      if (bedspace.occupiedBeds <= 0) {
        throw new BadRequestException('No occupied beds to discharge');
      }
      
      bedspace.availableBeds += 1;
      bedspace.occupiedBeds -= 1;
    } else {
      if (bedspace.availableBeds <= 0) {
        throw new BadRequestException('No available beds for admission');
      }
      
      bedspace.availableBeds -= 1;
      bedspace.occupiedBeds += 1;
    }
    
    const updatedBedspace = await bedspace.save();
    
    this.eventEmitter.emit('bedspace.updated', {
      hospitalId: updatedBedspace.hospital,
      bedspace: updatedBedspace,
    });
    
    return updatedBedspace;
  }
}