import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Schema as MongooseSchema } from 'mongoose';

import { Bedspace, BedspaceDocument } from './schemas/bedspace.schema';
import { CreateBedspaceDto } from './dto/create-bedspace.dto';
import { UpdateBedspaceDto } from './dto/update-bedspace.dto';

@Injectable()
export class BedspaceService {
  constructor(
    @InjectModel(Bedspace.name) private bedspaceModel: Model<BedspaceDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createBedspaceDto: CreateBedspaceDto): Promise<BedspaceDocument> {
    // Validate that available + occupied = total
    if (createBedspaceDto.availableBeds + createBedspaceDto.occupiedBeds !== createBedspaceDto.totalBeds) {
      throw new BadRequestException('Available beds + occupied beds must equal total beds');
    }
    
    // Create new bedspace
    const createdBedspace = new this.bedspaceModel(createBedspaceDto);
    const savedBedspace = await createdBedspace.save();
    
    // Emit event for bedspace creation
    this.eventEmitter.emit('bedspace.created', {
      hospitalId: savedBedspace.hospital,
      bedspace: savedBedspace,
    });
    
    return savedBedspace;
  }

  async findAllBedspaces(hospitalId?: string): Promise<BedspaceDocument[]> {
    const query = hospitalId ? { hospital: new MongooseSchema.Types.ObjectId(hospitalId) } : {};
    return this.bedspaceModel.find(query).exec();
  }

  async findOne(id: string): Promise<BedspaceDocument> {
    const bedspace = await this.bedspaceModel.findById(id).exec();
    
    if (!bedspace) {
      throw new NotFoundException(`Bedspace with ID ${id} not found`);
    }
    
    return bedspace;
  }

  async update(id: string, updateBedspaceDto: UpdateBedspaceDto): Promise<BedspaceDocument> {
    // Find bedspace
    const bedspace = await this.findOne(id);
    
    // Validate total beds if both available and occupied are provided
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
      // If total beds not provided, calculate from available + occupied
      updateBedspaceDto.totalBeds = updateBedspaceDto.availableBeds + updateBedspaceDto.occupiedBeds;
    } else if (updateBedspaceDto.availableBeds !== undefined) {
      // If only available beds provided, adjust occupied beds
      const currentOccupied = bedspace.occupiedBeds;
      const newTotal = updateBedspaceDto.totalBeds || bedspace.totalBeds;
      updateBedspaceDto.occupiedBeds = newTotal - updateBedspaceDto.availableBeds;
    } else if (updateBedspaceDto.occupiedBeds !== undefined) {
      // If only occupied beds provided, adjust available beds
      const newTotal = updateBedspaceDto.totalBeds || bedspace.totalBeds;
      updateBedspaceDto.availableBeds = newTotal - updateBedspaceDto.occupiedBeds;
    }
    
    // Update bedspace
    const updatedBedspace = await this.bedspaceModel
      .findByIdAndUpdate(id, updateBedspaceDto, { new: true })
      .exec();
    
    // Emit event for bedspace update
    this.eventEmitter.emit('bedspace.updated', {
      hospitalId: updatedBedspace.hospital,
      bedspace: updatedBedspace,
    });
    
    return updatedBedspace;
  }

  async remove(id: string): Promise<void> {
    // Find bedspace
    const bedspace = await this.findOne(id);
    
    // Delete bedspace
    await this.bedspaceModel.findByIdAndDelete(id).exec();
    
    // Emit event for bedspace removal
    this.eventEmitter.emit('bedspace.removed', {
      hospitalId: bedspace.hospital,
      bedspaceId: bedspace._id,
    });
  }

  async getHospitalSummary(hospitalId: string): Promise<any> {
    // Validate hospital ID
    try {
      // Try to create a new ObjectId to validate it
      new MongooseSchema.Types.ObjectId(hospitalId)
    } catch (error) {
      throw new BadRequestException('Invalid hospital ID');
    }
    
    // Aggregate bedspace data for the hospital
    const aggregationResult = await this.bedspaceModel.aggregate([
      { $match: { hospital: new MongooseSchema.Types.ObjectId(hospitalId) } },
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
    // Find bedspace
    const bedspace = await this.findOne(id);
    
    // Update available and occupied beds
    if (increment) {
      // Increasing available beds (discharge)
      if (bedspace.occupiedBeds <= 0) {
        throw new BadRequestException('No occupied beds to discharge');
      }
      
      bedspace.availableBeds += 1;
      bedspace.occupiedBeds -= 1;
    } else {
      // Decreasing available beds (admission)
      if (bedspace.availableBeds <= 0) {
        throw new BadRequestException('No available beds for admission');
      }
      
      bedspace.availableBeds -= 1;
      bedspace.occupiedBeds += 1;
    }
    
    // Save changes
    const updatedBedspace = await bedspace.save();
    
    // Emit event for bedspace update
    this.eventEmitter.emit('bedspace.updated', {
      hospitalId: updatedBedspace.hospital,
      bedspace: updatedBedspace,
    });
    
    return updatedBedspace;
  }
}