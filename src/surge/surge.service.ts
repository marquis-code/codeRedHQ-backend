import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Surge, SurgeDocument } from './schema/surge.schema';
import { Hospital, HospitalDocument } from '../hospital/schemas/hospital.schema';

@Injectable()
export class SurgeService {
  private readonly logger = new Logger(SurgeService.name);

  constructor(
    @InjectModel(Surge.name) private surgeModel: Model<SurgeDocument>,
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createSurge(createSurgeDto: {
    hospitalId: string;
    latitude: number;
    longitude: number;
    address?: string;
    emergencyType?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<Surge> {
    const { hospitalId, ...surgeData } = createSurgeDto;

    // Verify hospital exists
    const hospital = await this.hospitalModel.findById(hospitalId);
    if (!hospital) {
      throw new Error(`Hospital with ID ${hospitalId} not found`);
    }

    // Create new surge
    const newSurge = new this.surgeModel({
      ...surgeData,
      hospital: hospitalId,
      status: 'pending',
    });

    const savedSurge = await newSurge.save();
    console.log('saved surge', hospitalId)

    // Emit event for WebSocket gateway
    this.eventEmitter.emit('surge.created', {
      hospitalId,
      surge: savedSurge.toObject(),
    });

    return savedSurge;
  }

  async updateSurgeStatus(
    surgeId: string,
    status: string,
    metadata?: Record<string, any>,
  ): Promise<Surge> {
    const surge = await this.surgeModel.findById(surgeId);
    
    if (!surge) {
      throw new Error(`Surge with ID ${surgeId} not found`);
    }

    surge.status = status;
    
    if (metadata) {
      surge.metadata = { ...surge.metadata, ...metadata };
    }

    const updatedSurge = await surge.save();

    // Emit event for WebSocket gateway
    this.eventEmitter.emit('surge.updated', {
      hospitalId: surge.hospital,
      surge: updatedSurge.toObject(),
    });

    return updatedSurge;
  }

  async getSurgesByHospital(hospitalId: string, status?: string[]): Promise<Surge[]> {
    const query: any = { hospital: hospitalId };
    
    if (status && status.length > 0) {
      query.status = { $in: status };
    }
    
    return this.surgeModel.find(query).exec();
  }

  async getSurgeById(surgeId: string): Promise<Surge> {
    return this.surgeModel.findById(surgeId).exec();
  }

  async getSurgesInRegion(
    latitude: number,
    longitude: number,
    radiusInKm: number,
    status?: string[],
  ): Promise<Surge[]> {
    // Convert km to radians (Earth radius is approximately 6371 km)
    const radiusInRadians = radiusInKm / 6371;
    
    // Find hospitals in the region
    const hospitals = await this.hospitalModel.find({
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians],
        },
      },
    }).exec();
    
    const hospitalIds = hospitals.map(h => h._id);
    
    // Find surges for these hospitals
    const query: any = { hospital: { $in: hospitalIds } };
    
    if (status && status.length > 0) {
      query.status = { $in: status };
    }
    
    return this.surgeModel.find(query).exec();
  }
}