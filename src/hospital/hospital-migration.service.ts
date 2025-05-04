import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hospital, HospitalDocument } from './schemas/hospital.schema';

@Injectable()
export class HospitalMigrationService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
  ) {}

  /**
   * Migrate all existing hospitals to add GeoJSON location field
   */
  async migrateLocations(): Promise<{ success: boolean; message: string }> {
    try {
      // Find all hospitals that have lat/long but no GeoJSON location
      const hospitals = await this.hospitalModel.find({
        latitude: { $exists: true },
        longitude: { $exists: true },
        $or: [
          { location: { $exists: false } },
          { 'location.type': { $exists: false } }
        ]
      }).exec();
      
      console.log(`Found ${hospitals.length} hospitals to update`);
      
      let updateCount = 0;
      
      // Update each hospital
      for (const hospital of hospitals) {
        hospital.location = {
          type: 'Point',
          coordinates: [hospital.longitude, hospital.latitude]
        };
        
        await hospital.save();
        updateCount++;
        
        // Log progress for large datasets
        if (updateCount % 100 === 0) {
          console.log(`Processed ${updateCount} hospitals so far...`);
        }
      }
      
      return {
        success: true,
        message: `Successfully updated ${updateCount} hospitals with GeoJSON location data`
      };
    } catch (error) {
      console.error('Error migrating hospital data:', error);
      return {
        success: false,
        message: `Migration failed: ${error.message}`
      };
    }
  }
}