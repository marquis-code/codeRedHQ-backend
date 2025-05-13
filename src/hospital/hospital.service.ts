
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hospital, HospitalModel } from './schemas/hospital.schema';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';

@Injectable()
export class HospitalService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalModel>,
  ) {}

  async create(createHospitalDto: CreateHospitalDto): Promise<Hospital> {
    // Check if email already exists
    const existingEmail = await this.hospitalModel.findOne({ email: createHospitalDto.email }).exec();
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Generate a unique username based on hospital name and location
    const username = await this.generateUniqueUsername(
      createHospitalDto.hospitalName,
      createHospitalDto.address
    );

    // Create new hospital with generated username
    const newHospital = new this.hospitalModel({
      ...createHospitalDto,
      username,
    });

    return newHospital.save();
  }

  async findAll(query: any): Promise<Hospital[]> {
    return this.hospitalModel.find(query).populate('bedspaces').exec();
  }

  // async findOne(id: string): Promise<Hospital> {
  //   const hospital = await this.hospitalModel.findById(id).populate('bedspaces').exec();
  //   if (!hospital) {
  //     throw new NotFoundException(`Hospital with ID ${id} not found`);
  //   }
  //   return hospital;
  // }

  async findByUsernameOrEmail(usernameOrEmail: string): Promise<Hospital> {
    const hospital = await this.hospitalModel.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    }).populate('bedspaces').exec();
    
    if (!hospital) {
      throw new NotFoundException(`Hospital not found`);
    }
    
    return hospital;
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto): Promise<Hospital> {
    const hospital = await this.hospitalModel
      .findByIdAndUpdate(id, updateHospitalDto, { new: true })
      .exec();
    
    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }
    
    return hospital;
  }

  async remove(id: string): Promise<void> {
    const result = await this.hospitalModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }
  }

  async findNearby(
    latitude: number,
    longitude: number,
    maxDistance: number = 10000, // Default 10km
  ): Promise<Hospital[]> {
    try {
      // Ensure coordinates are numbers
      const lat = Number(latitude);
      const lng = Number(longitude);
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates: latitude and longitude must be numbers');
      }
      
      // Log query parameters for debugging
      console.log(`Searching for hospitals near [${lng}, ${lat}] with max distance ${maxDistance}m`);
      
      // Find hospitals near the specified coordinates using the GeoJSON location field
      const hospitals = await this.hospitalModel.find({
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat], // GeoJSON uses [lng, lat] order
            },
            $maxDistance: maxDistance,
          },
        },
      }).populate('bedspaces').exec();
      
      console.log(`Found ${hospitals.length} hospitals within ${maxDistance}m`);
      return hospitals;
    } catch (error) {
      console.error('Error in findNearby:', error);
      throw error;
    }
  }
  
  // Alternative approach using aggregation
  async findNearbyAggregation(
    latitude: number,
    longitude: number,
    maxDistance: number = 10000, // Default 10km
  ): Promise<Hospital[]> {
    try {
      // Ensure coordinates are numbers
      const lat = Number(latitude);
      const lng = Number(longitude);
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates: latitude and longitude must be numbers');
      }
      
      // Use MongoDB's geoNear aggregation for more control and distance calculation
      const hospitals = await this.hospitalModel.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            distanceField: 'distance', // Adds a distance field to results
            maxDistance: maxDistance,
            spherical: true,
          }
        },
        {
          $sort: { distance: 1 } // Sort by distance (closest first)
        }
      ]).exec();
      
      console.log(`Found ${hospitals.length} hospitals within ${maxDistance}m using aggregation`);
      return hospitals;
    } catch (error) {
      console.error('Error in findNearbyAggregation:', error);
      throw error;
    }
  }
  
  // Helper method to verify that a specific hospital is being indexed correctly
  async verifyLocationIndex(hospitalId: string): Promise<any> {
    try {
      const hospital = await this.hospitalModel.findById(hospitalId).exec();
      if (!hospital) {
        return { error: 'Hospital not found' };
      }
      
      // Return the hospital's location data for verification
      return {
        hospital_id: hospital._id,
        location: hospital.location,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        // Check if location index exists
        indexes: await this.hospitalModel.collection.getIndexes(),
      };
    } catch (error) {
      console.error('Error verifying location index:', error);
      throw error;
    }
  }
  
  // Test method to find a specific hospital by exact coordinates
  async findByExactCoordinates(latitude: number, longitude: number): Promise<Hospital[]> {
    return this.hospitalModel.find({
      latitude: latitude,
      longitude: longitude
    }).exec();
  }

  private async generateUniqueUsername(hospitalName: string, address: string): Promise<string> {
    // Extract city or area from address (simplified approach)
    const addressParts = address.split(',');
    const locationPart = addressParts.length > 1 
      ? addressParts[addressParts.length - 2].trim() 
      : addressParts[0].trim();
    
    // Create base username by combining hospital name and location
    // Remove special characters, convert to lowercase, replace spaces with underscores
    let baseUsername = `${hospitalName}_${locationPart}`
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '_');
    
    // Check if username exists
    let username = baseUsername;
    let counter = 1;
    
    // Keep checking until we find a unique username
    while (await this.hospitalModel.findOne({ username }).exec()) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }
    
    return username;
  }

  async validateHospital(usernameOrEmail: string, password: string): Promise<Hospital | null> {
    try {
      const hospital = await this.hospitalModel.findOne({
        $or: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }).exec();
      
      if (!hospital) {
        return null;
      }
      
      const isPasswordValid = await hospital.comparePassword(password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      return hospital;
    } catch (error) {
      return null;
    }
  }

  // In your hospital service
async updateHospitalBedspaceSummary(hospitalId: string): Promise<Hospital> {
  const hospital = await this.hospitalModel.findById(hospitalId);
  if (!hospital) {
    throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
  }
  
  await hospital.updateBedspaceSummary();
  return hospital;
}

// async findOne(id: string): Promise<Hospital> {
//   try {
//     // First try to find by _id if it's a valid ObjectId
//     if (/^[0-9a-fA-F]{24}$/.test(id)) {
//       const hospital = await this.hospitalModel.findById(id)
//         .maxTimeMS(5000) // Add a 5-second timeout
//         .exec();
      
//       if (hospital) {
//         return hospital;
//       }
//     }
    
//     // If not found by _id or not a valid ObjectId, try by placeId
//     const hospitalByPlaceId = await this.hospitalModel.findOne({ placeId: id })
//       .maxTimeMS(5000) // Add a 5-second timeout
//       .exec();
    
//     if (hospitalByPlaceId) {
//       return hospitalByPlaceId;
//     }
    
//     throw new NotFoundException(`Hospital with ID ${id} not found`);
//   } catch (error) {
//     if (error instanceof NotFoundException) {
//       throw error;
//     }
//     console.error(`Error finding hospital with ID ${id}:`, error);
//     throw new NotFoundException(`Error finding hospital with ID ${id}`);
//   }
// }

async findOne(id: string): Promise<Hospital> {
  try {
    // First try to find by _id if it's a valid ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      const hospital = await this.hospitalModel.findById(id)
        .maxTimeMS(5000) // Add a 5-second timeout
        .exec();
      
      if (hospital) {
        return hospital;
      }
    }
    
    // If not found by _id or not a valid ObjectId, try by placeId
    const hospitalByPlaceId = await this.hospitalModel.findOne({ placeId: id })
      .maxTimeMS(5000) // Add a 5-second timeout
      .exec();
    
    if (hospitalByPlaceId) {
      return hospitalByPlaceId;
    }
    
    throw new NotFoundException(`Hospital with ID ${id} not found`);
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    console.error(`Error finding hospital with ID ${id}:`, error);
    throw new NotFoundException(`Error finding hospital with ID ${id}`);
  }
}


}