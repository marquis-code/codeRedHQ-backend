import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hospital, HospitalDocument } from '../../hospital/schemas/hospital.schema';

@Injectable()
export class HospitalMigrationService {
  private readonly logger = new Logger(HospitalMigrationService.name);

  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
  ) {}

  /**
   * Migrate all existing hospitals to add GeoJSON location field
   */
  async migrateLocations(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Starting hospital location migration...');
      
      // Find all hospitals that have lat/long but no GeoJSON location
      const hospitals = await this.hospitalModel.find({
        latitude: { $exists: true },
        longitude: { $exists: true },
        $or: [
          { location: { $exists: false } },
          { 'location.type': { $exists: false } }
        ]
      }).exec();
      
      this.logger.log(`Found ${hospitals.length} hospitals to update`);
      
      if (hospitals.length === 0) {
        return {
          success: true,
          message: 'No hospitals require migration - all records are up to date'
        };
      }
      
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
          this.logger.log(`Processed ${updateCount}/${hospitals.length} hospitals...`);
        }
      }
      
      this.logger.log(`Migration complete. Updated ${updateCount} hospitals`);
      
      return {
        success: true,
        message: `Successfully updated ${updateCount} hospitals with GeoJSON location data`
      };
    } catch (error) {
      this.logger.error(`Migration failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Migration failed: ${error.message}`
      };
    }
  }
}