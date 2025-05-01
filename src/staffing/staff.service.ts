import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Schema as MongooseSchema } from 'mongoose';

import { Staff, StaffDocument } from './schemas/staff.schema';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffingService {
  constructor(
    @InjectModel(Staff.name)
    private staffModel: Model<StaffDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createStaffDto: CreateStaffDto): Promise<StaffDocument> {
    // Create new staff
    const createdStaff = new this.staffModel(createStaffDto);
    const savedStaff = await createdStaff.save();
    
    // Emit event for staff creation
    this.eventEmitter.emit('staff.created', {
      hospitalId: savedStaff.hospital,
      staff: savedStaff,
    });
    
    return savedStaff;
  }

  async findAll(hospitalId?: string, department?: string, availability?: string): Promise<StaffDocument[]> {
    // Build query
    const query: any = { isActive: true };
    
    if (hospitalId) {
      query.hospital = new Types.ObjectId(hospitalId)
    }
    
    if (department) {
      query.department = department;
    }
    
    if (availability) {
      query.availability = availability;
    }
    
    return this.staffModel.find(query).exec();
  }

  async findOne(id: string): Promise<StaffDocument> {
    const staff = await this.staffModel.findById(id).exec();
    
    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }
    
    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto): Promise<StaffDocument> {
    // Find staff first to check if it exists
    const existingStaff = await this.findOne(id);
    
    // Convert updateStaffDto to a plain object that mongoose can work with
    const updateData = { ...updateStaffDto };
    
    // If hospital is provided as ObjectId, ensure it's properly converted
    if (updateData.hospital && typeof updateData.hospital === 'string') {
      updateData.hospital = new Types.ObjectId(updateData.hospital);
    }
    
    // Update staff using findOneAndUpdate to get the updated document
    const updatedStaff = await this.staffModel
      .findOneAndUpdate({ _id: id }, { $set: updateData }, { new: true })
      .exec();
    
    if (!updatedStaff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }
    
    // Emit event for staff update
    this.eventEmitter.emit('staff.updated', {
      hospitalId: updatedStaff.hospital,
      staff: updatedStaff,
    });
    
    return updatedStaff;
  }

  async remove(id: string): Promise<void> {
    // Find staff
    const staff = await this.findOne(id);
    
    // Soft delete by setting isActive to false
    await this.staffModel.findByIdAndUpdate(id, { isActive: false }).exec();
    
    // Emit event for staff removal
    this.eventEmitter.emit('staff.removed', {
      hospitalId: staff.hospital,
      staffId: staff._id,
    });
  }

  async updateAvailability(id: string, availability: string): Promise<StaffDocument> {
    // Validate availability
    if (!['Available', 'Unavailable'].includes(availability)) {
      throw new BadRequestException('Availability must be either "Available" or "Unavailable"');
    }
    
    // Find staff
    const staff = await this.findOne(id);
    
    // Update availability
    staff.availability = availability;
    const updatedStaff = await staff.save();
    
    // Emit event for staff availability update
    this.eventEmitter.emit('staff.availability_updated', {
      hospitalId: updatedStaff.hospital,
      staffId: updatedStaff._id,
      availability: updatedStaff.availability,
    });
    
    return updatedStaff;
  }

  async getStaffSummary(hospitalId: string): Promise<any> {
    // Validate hospital ID
    try {
      new Types.ObjectId(hospitalId);
    } catch (error) {
      throw new BadRequestException('Invalid hospital ID');
    }
    
    // Aggregate staff data for the hospital
    const aggregationResult = await this.staffModel.aggregate([
      { $match: { hospital: new Types.ObjectId(hospitalId), isActive: true } },
      { $group: {
          _id: '$availability',
          count: { $sum: 1 },
          departments: {
            $push: {
              department: '$department',
              position: '$position',
              name: '$name'
            }
          }
        }
      },
      {
        $project: {
          availability: '$_id',
          count: 1,
          departments: 1,
          _id: 0
        }
      }
    ]).exec();
    
    // Transform result
    const result = {
      total: 0,
      available: 0,
      unavailable: 0,
      byDepartment: {},
      byPosition: {}
    };
    
    // Process aggregation results
    aggregationResult.forEach(item => {
      result.total += item.count;
      
      if (item.availability === 'Available') {
        result.available = item.count;
      } else {
        result.unavailable = item.count;
      }
      
      // Process departments and positions
      item.departments.forEach(staff => {
        // Count by department
        if (!result.byDepartment[staff.department]) {
          result.byDepartment[staff.department] = {
            total: 0,
            available: 0,
            unavailable: 0
          };
        }
        
        result.byDepartment[staff.department].total++;
        
        if (item.availability === 'Available') {
          result.byDepartment[staff.department].available++;
        } else {
          result.byDepartment[staff.department].unavailable++;
        }
        
        // Count by position
        if (!result.byPosition[staff.position]) {
          result.byPosition[staff.position] = {
            total: 0,
            available: 0,
            unavailable: 0
          };
        }
        
        result.byPosition[staff.position].total++;
        
        if (item.availability === 'Available') {
          result.byPosition[staff.position].available++;
        } else {
          result.byPosition[staff.position].unavailable++;
        }
      });
    });
    
    return result;
  }
}