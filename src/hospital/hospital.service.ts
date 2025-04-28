import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Hospital, HospitalDocument } from './schemas/hospital.schema';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';

@Injectable()
export class HospitalService {
  constructor(
    @InjectModel(Hospital.name)
    private hospitalModel: Model<HospitalDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createHospitalDto: CreateHospitalDto): Promise<HospitalDocument> {
    // Check if hospital with same name already exists
    const existingHospital = await this.hospitalModel.findOne({ 
      hospitalName: createHospitalDto.hospitalName 
    }).exec();
    
    if (existingHospital) {
      throw new ConflictException('Hospital with this name already exists');
    }
    
    // Generate UUID if not provided
    if (!createHospitalDto.uuid) {
      createHospitalDto.uuid = uuidv4();
    }
    
    // Create new hospital
    const createdHospital = new this.hospitalModel(createHospitalDto);
    const savedHospital = await createdHospital.save();
    
    // Emit event for hospital creation
    this.eventEmitter.emit('hospital.created', {
      hospitalId: savedHospital._id,
      hospitalName: savedHospital.hospitalName,
    });
    
    return savedHospital;
  }

  async findAll(query: any = {}): Promise<HospitalDocument[]> {
    const { page = 1, limit = 10, ...filters } = query;
    
    // Build filter object
    const filterObj: any = { isActive: true };
    
    if (filters.facilityType) {
      filterObj.facilityType = filters.facilityType;
    }
    
    if (filters.emergencyServices) {
      filterObj.emergencyServices = filters.emergencyServices;
    }
    
    if (filters.specialties) {
      filterObj.availableSpecialties = { $in: filters.specialties.split(',') };
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    return this.hospitalModel
      .find(filterObj)
      .select('-password') // Exclude password
      .skip(Number(skip))
      .limit(Number(limit))
      .exec();
  }

  async findOne(id: string): Promise<HospitalDocument> {
    let hospital;
    
    // Check if id is a valid ObjectId
    if (isValidObjectId(id)) {
      hospital = await this.hospitalModel.findById(id).select('-password').exec();
    } else {
      // Try to find by UUID
      hospital = await this.hospitalModel.findOne({ uuid: id }).select('-password').exec();
    }
    
    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }
    
    return hospital;
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto): Promise<HospitalDocument> {
    // Find hospital
    const hospital = await this.findOne(id);
    
    // Update hospital
    const updatedHospital = await this.hospitalModel
      .findByIdAndUpdate(
        hospital._id, 
        { $set: updateHospitalDto as any }, 
        { new: true }
      )
      .select('-password')
      .exec();
    
    if (!updatedHospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found after update attempt`);
    }
    
    // Emit event for hospital update
    this.eventEmitter.emit('hospital.updated', {
      hospitalId: updatedHospital._id,
      hospitalName: updatedHospital.hospitalName,
    });
    
    return updatedHospital;
  }

  async remove(id: string): Promise<void> {
    // Find hospital
    const hospital = await this.findOne(id);
    
    // Soft delete by setting isActive to false
    await this.hospitalModel.findByIdAndUpdate(hospital._id, { isActive: false }).exec();
    
    // Emit event for hospital removal
    this.eventEmitter.emit('hospital.removed', {
      hospitalId: hospital._id,
      hospitalName: hospital.hospitalName,
    });
  }

  async findNearby(latitude: number, longitude: number, maxDistance: number = 10000): Promise<HospitalDocument[]> {
    // Find hospitals within the specified radius (in meters)
    // MongoDB uses radians for geospatial queries, so we need to convert
    
    if (!latitude || !longitude) {
      throw new BadRequestException('Latitude and longitude are required');
    }
    
    return this.hospitalModel.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude], // MongoDB uses [longitude, latitude]
          },
          $maxDistance: maxDistance, // in meters
        },
      },
    })
    .select('-password')
    .exec();
  }
}