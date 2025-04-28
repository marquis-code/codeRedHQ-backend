import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Hospital, HospitalDocument } from '../hospital/schemas/hospital.schema';
import { Bedspace, BedspaceDocument } from '../bedspace/schemas/bedspace.schema';

@Injectable()
export class MapService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    @InjectModel(Bedspace.name) private bedspaceModel: Model<BedspaceDocument>,
  ) {}

  async getNearbyHospitals(latitude: number, longitude: number, radius: number = 10000): Promise<any[]> {
    if (!latitude || !longitude) {
      throw new BadRequestException('Latitude and longitude are required');
    }
    
    // Find hospitals within radius
    const hospitals = await this.hospitalModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: radius,
          spherical: true,
          query: { isActive: true }
        }
      },
      {
        $project: {
          _id: 1,
          uuid: 1,
          hospitalName: 1,
          address: 1,
          facilityType: 1,
          emergencyServices: 1,
          latitude: 1,
          longitude: 1,
          distance: 1
        }
      }
    ]).exec();
    
    // Get bedspace information for each hospital
    const hospitalsWithBedspace = await Promise.all(
      hospitals.map(async hospital => {
        const bedspaceSummary = await this.bedspaceModel.aggregate([
          { $match: { hospital: hospital._id } },
          { $group: {
              _id: null,
              totalBeds: { $sum: '$totalBeds' },
              availableBeds: { $sum: '$availableBeds' },
              occupiedBeds: { $sum: '$occupiedBeds' }
            }
          }
        ]).exec();
        
        const bedspace = bedspaceSummary.length > 0 ? bedspaceSummary[0] : {
          totalBeds: 0,
          availableBeds: 0,
          occupiedBeds: 0
        };
        
        // Calculate availability status
        let status = 'unavailable';
        if (bedspace.availableBeds > 0) {
          const occupancyRate = (bedspace.occupiedBeds / bedspace.totalBeds) * 100;
          status = occupancyRate >= 80 ? 'limited' : 'available';
        }
        
        return {
          ...hospital,
          bedspace: {
            total: bedspace.totalBeds,
            available: bedspace.availableBeds,
            occupied: bedspace.occupiedBeds
          },
          status
        };
      })
    );
    
    return hospitalsWithBedspace;
  }

  async getEmergencySurgePoints(): Promise<any[]> {
    // Find hospitals with high occupancy (potential surge points)
    const surgePoints = await this.bedspaceModel.aggregate([
      {
        $group: {
          _id: '$hospital',
          totalBeds: { $sum: '$totalBeds' },
          availableBeds: { $sum: '$availableBeds' },
          occupiedBeds: { $sum: '$occupiedBeds' }
        }
      },
      {
        $match: {
          $expr: {
            $gte: [
              { $divide: ['$occupiedBeds', '$totalBeds'] },
              0.8 // 80% occupancy threshold for surge
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'hospitals',
          localField: '_id',
          foreignField: '_id',
          as: 'hospital'
        }
      },
      {
        $unwind: '$hospital'
      },
      {
        $project: {
          _id: 0,
          hospitalId: '$_id',
          hospitalName: '$hospital.hospitalName',
          address: '$hospital.address',
          latitude: '$hospital.latitude',
          longitude: '$hospital.longitude',
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupiedBeds', '$totalBeds'] },
              100
            ]
          },
          totalBeds: 1,
          availableBeds: 1,
          occupiedBeds: 1
        }
      }
    ]).exec();
    
    return surgePoints;
  }

  async getHospitalDensityHeatmap(): Promise<any[]> {
    // Generate heatmap data based on hospital density and bed availability
    const heatmapData = await this.hospitalModel.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'bedspaces',
          localField: '_id',
          foreignField: 'hospital',
          as: 'bedspaces'
        }
      },
      {
        $addFields: {
          totalBeds: { $sum: '$bedspaces.totalBeds' },
          availableBeds: { $sum: '$bedspaces.availableBeds' },
          occupiedBeds: { $sum: '$bedspaces.occupiedBeds' }
        }
      },
      {
        $project: {
          _id: 0,
          location: {
            lat: '$latitude',
            lng: '$longitude'
          },
          weight: {
            $cond: {
              if: { $eq: ['$totalBeds', 0] },
              then: 1,
              else: {
                $subtract: [
                  1,
                  { $divide: ['$availableBeds', '$totalBeds'] }
                ]
              }
            }
          },
          hospitalName: 1,
          totalBeds: 1,
          availableBeds: 1,
          occupiedBeds: 1
        }
      }
    ]).exec();
    
    return heatmapData;
  }
}