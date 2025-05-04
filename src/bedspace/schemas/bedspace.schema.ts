// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Schema as MongooseSchema } from 'mongoose';
// import { Types } from 'mongoose';

// // Define the interface for the document, which extends Document and Bedspace
// export interface BedspaceDocument extends Document, Bedspace {}

// @Schema({ timestamps: true })
// export class Bedspace {
//   @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
//   hospital: Types.ObjectId;

//   @Prop({ required: true })
//   departmentName: string;

//   @Prop({ required: true })
//   location: string;

//   @Prop({ required: true })
//   totalBeds: number;

//   @Prop({ required: true, default: 0 })
//   availableBeds: number;

//   @Prop({ required: true, default: 0 })
//   occupiedBeds: number;

//   @Prop()
//   lastUpdated: Date;

//   @Prop({ enum: ['Available', 'Limited', 'Unavailable'], default: 'Available' })
//   status: string;

//   @Prop({ type: [{ date: Date, available: Number, occupied: Number }], default: [] })
//   history: Array<{
//     date: Date;
//     available: number;
//     occupied: number;
//   }>;
// }

// export const BedspaceSchema = SchemaFactory.createForClass(Bedspace);

// // Calculate status based on available beds
// BedspaceSchema.pre('save', function (next) {
//   const bedspace = this as BedspaceDocument;
  
//   // Update lastUpdated timestamp
//   bedspace.lastUpdated = new Date();
  
//   // Calculate occupancy percentage
//   const occupancyPercentage = (bedspace.occupiedBeds / bedspace.totalBeds) * 100;
  
//   // Set status based on occupancy
//   if (bedspace.availableBeds === 0) {
//     bedspace.status = 'Unavailable';
//   } else if (occupancyPercentage >= 80) {
//     bedspace.status = 'Limited';
//   } else {
//     bedspace.status = 'Available';
//   }
  
//   // Add to history
//   bedspace.history.push({
//     date: new Date(),
//     available: bedspace.availableBeds,
//     occupied: bedspace.occupiedBeds
//   });
  
//   // Limit history to last 100 entries
//   if (bedspace.history.length > 100) {
//     bedspace.history = bedspace.history.slice(-100);
//   }
  
//   next();
// });


import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, model } from 'mongoose';
import { Types } from 'mongoose';

// Define the interface for the document, which extends Document and Bedspace
export interface BedspaceDocument extends Document, Bedspace {}

@Schema({ timestamps: true })
export class Bedspace {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
  hospital: Types.ObjectId;

  @Prop({ required: true })
  departmentName: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  totalBeds: number;

  @Prop({ required: true, default: 0 })
  availableBeds: number;

  @Prop({ required: true, default: 0 })
  occupiedBeds: number;

  @Prop()
  lastUpdated: Date;

  @Prop({ enum: ['Available', 'Limited', 'Unavailable'], default: 'Available' })
  status: string;

  @Prop({ type: [{ date: Date, available: Number, occupied: Number }], default: [] })
  history: Array<{
    date: Date;
    available: number;
    occupied: number;
  }>;
}

export const BedspaceSchema = SchemaFactory.createForClass(Bedspace);

// Store for hospital IDs that need to be updated after operations
// This is a simple way to pass context between pre and post hooks
const hospitalUpdateQueue = new Map<string, string[]>();

// Calculate status based on available beds
BedspaceSchema.pre('save', async function (next) {
  const bedspace = this as BedspaceDocument;
  
  // Update lastUpdated timestamp
  bedspace.lastUpdated = new Date();
  
  // Calculate occupancy percentage
  const occupancyPercentage = (bedspace.occupiedBeds / bedspace.totalBeds) * 100;
  
  // Set status based on occupancy
  if (bedspace.availableBeds === 0) {
    bedspace.status = 'Unavailable';
  } else if (occupancyPercentage >= 80) {
    bedspace.status = 'Limited';
  } else {
    bedspace.status = 'Available';
  }
  
  // Add to history
  bedspace.history.push({
    date: new Date(),
    available: bedspace.availableBeds,
    occupied: bedspace.occupiedBeds
  });
  
  // Limit history to last 100 entries
  if (bedspace.history.length > 100) {
    bedspace.history = bedspace.history.slice(-100);
  }
  
  next();
});

// After saving a bedspace, update the associated hospital's bedspace summary
BedspaceSchema.post('save', async function() {
  const bedspace = this as BedspaceDocument;
  
  try {
    // Get the Hospital model
    const HospitalModel = model('Hospital');
    
    // Find the associated hospital
    const hospital = await HospitalModel.findById(bedspace.hospital);
    
    if (hospital) {
      // Update the hospital's bedspace summary
      await hospital.updateBedspaceSummary();
    }
  } catch (error) {
    console.error('Error updating hospital after bedspace save:', error);
    // Don't throw the error to prevent the bedspace save from failing
  }
});

// After updating a bedspace, update the associated hospital's bedspace summary
BedspaceSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    try {
      // Get the Hospital model
      const HospitalModel = model('Hospital');
      
      // Find the associated hospital
      const hospital = await HospitalModel.findById(doc.hospital);
      
      if (hospital) {
        // Update the hospital's bedspace summary
        await hospital.updateBedspaceSummary();
      }
    } catch (error) {
      console.error('Error updating hospital after bedspace update:', error);
    }
  }
});

// Handle document-level deleteOne
BedspaceSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const bedspace = this as BedspaceDocument;
  if (bedspace.hospital) {
    try {
      // Get the Hospital model
      const HospitalModel = model('Hospital');
      
      // Find the associated hospital
      const hospital = await HospitalModel.findById(bedspace.hospital);
      
      if (hospital) {
        // Update the hospital's bedspace summary after the document is deleted
        await hospital.updateBedspaceSummary();
      }
    } catch (error) {
      console.error('Error updating hospital after bedspace deletion:', error);
    }
  }
});

// For findOneAndDelete operations
BedspaceSchema.pre('findOneAndDelete', async function() {
  try {
    // Find the bedspace that will be deleted
    const bedspace = await this.model.findOne(this.getFilter());
    
    if (bedspace && bedspace.hospital) {
      // Generate a unique key for this operation
      const operationId = Date.now().toString() + Math.random().toString();
      
      // Store the hospital ID in our queue
      hospitalUpdateQueue.set(operationId, [bedspace.hospital.toString()]);
      
      // Store the operation ID in the query options
      // @ts-ignore - This is a valid way to pass data between pre and post hooks
      this.options = this.options || {};
      // @ts-ignore
      this.options._operationId = operationId;
    }
  } catch (error) {
    console.error('Error in pre findOneAndDelete:', error);
  }
});

BedspaceSchema.post('findOneAndDelete', async function() {
  try {
    // @ts-ignore - Retrieve the operation ID
    const operationId = this.options?._operationId;
    
    if (operationId && hospitalUpdateQueue.has(operationId)) {
      const hospitalIds = hospitalUpdateQueue.get(operationId) || [];
      hospitalUpdateQueue.delete(operationId); // Clean up
      
      // Update each hospital
      const HospitalModel = model('Hospital');
      
      for (const hospitalId of hospitalIds) {
        const hospital = await HospitalModel.findById(hospitalId);
        if (hospital) {
          await hospital.updateBedspaceSummary();
        }
      }
    }
  } catch (error) {
    console.error('Error in post findOneAndDelete:', error);
  }
});

// For deleteMany operations
BedspaceSchema.pre('deleteMany', async function() {
  try {
    // Find all bedspaces that will be deleted
    const bedspaces = await this.model.find(this.getFilter(), 'hospital');
    
    if (bedspaces.length > 0) {
      // Extract unique hospital IDs
      const hospitalIds = [...new Set(bedspaces.map(b => 
        b.hospital ? b.hospital.toString() : null
      ).filter(id => id !== null))];
      
      if (hospitalIds.length > 0) {
        // Generate a unique key for this operation
        const operationId = Date.now().toString() + Math.random().toString();
        
        // Store the hospital IDs in our queue
        hospitalUpdateQueue.set(operationId, hospitalIds);
        
        // Store the operation ID in the query options
        // @ts-ignore - This is a valid way to pass data between pre and post hooks
        this.options = this.options || {};
        // @ts-ignore
        this.options._operationId = operationId;
      }
    }
  } catch (error) {
    console.error('Error in pre deleteMany:', error);
  }
});

BedspaceSchema.post('deleteMany', async function() {
  try {
    // @ts-ignore - Retrieve the operation ID
    const operationId = this.options?._operationId;
    
    if (operationId && hospitalUpdateQueue.has(operationId)) {
      const hospitalIds = hospitalUpdateQueue.get(operationId) || [];
      hospitalUpdateQueue.delete(operationId); // Clean up
      
      // Update each hospital
      const HospitalModel = model('Hospital');
      
      for (const hospitalId of hospitalIds) {
        const hospital = await HospitalModel.findById(hospitalId);
        if (hospital) {
          await hospital.updateBedspaceSummary();
        }
      }
    }
  } catch (error) {
    console.error('Error in post deleteMany:', error);
  }
});

// Add a static method to manually update hospital bedspace summaries
BedspaceSchema.statics.updateHospitalBedspaceSummary = async function(hospitalId: string) {
  try {
    const HospitalModel = model('Hospital');
    const hospital = await HospitalModel.findById(hospitalId);
    
    if (hospital) {
      await hospital.updateBedspaceSummary();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in updateHospitalBedspaceSummary:', error);
    return false;
  }
};