import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Connection } from 'mongoose';
import { Types } from 'mongoose';
import * as mongoose from 'mongoose';

// Define the interface for the document, which extends Document and Bedspace
export interface BedspaceDocument extends Document, Bedspace {}

@Schema({ timestamps: true })
export class Bedspace {
  @Prop({ 
    type: MongooseSchema.Types.Mixed, // Changed from ObjectId to Mixed to accept both string and ObjectId
    ref: 'Hospital', 
    required: true,
    // Add a validator to ensure it's either a string or ObjectId
    validate: {
      validator: function(v: any) {
        // Accept either string (for Google Place IDs) or ObjectId
        return typeof v === 'string' || v instanceof Types.ObjectId;
      },
      message: props => `${props.value} is not a valid hospital identifier!`
    }
  })
  hospital: Types.ObjectId | string;

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
// BedspaceSchema.pre('save', async function (next) {
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

// // Modified to use connection to get the model
// BedspaceSchema.post('save', async function() {
//   const bedspace = this as BedspaceDocument;
  
//   try {
//     // Get the connection from mongoose
//     const connection: Connection = mongoose.connection;
    
//     // Check if Hospital model exists in the connection
//     let HospitalModel;
//     try {
//       // Try to get the existing model
//       HospitalModel = connection.model('Hospital');
//     } catch (error) {
//       // If model doesn't exist, create a minimal schema to avoid errors
//       // This is just a fallback and won't be used if Hospital is properly registered
//       console.warn('Hospital model not found, creating temporary schema');
//       const tempSchema = new MongooseSchema({
//         _id: MongooseSchema.Types.ObjectId,
//         placeId: String,
//         bedspaces: [{ type: MongooseSchema.Types.ObjectId, ref: 'Bedspace' }]
//       });
      
//       // Add updateBedspaceSummary method to the schema
//       tempSchema.methods.updateBedspaceSummary = async function() {
//         // Add bedspace to the hospital's bedspaces array
//         if (!this.bedspaces.includes(bedspace._id)) {
//           this.bedspaces.push(bedspace._id);
//           await this.save();
//         }
//       };
      
//       HospitalModel = connection.model('Hospital', tempSchema);
//     }
    
//     // Find the associated hospital - handle both string IDs and ObjectIds
//     const hospital = await HospitalModel.findOne({
//       $or: [
//         { _id: bedspace.hospital },
//         { placeId: bedspace.hospital }
//       ]
//     });
    
//     if (hospital) {
//       if (typeof hospital.updateBedspaceSummary === 'function') {
//         await hospital.updateBedspaceSummary();
//       } else {
//         // Fallback: Update bedspaces array directly
//         if (!hospital.bedspaces.includes(bedspace._id)) {
//           hospital.bedspaces.push(bedspace._id);
//           await hospital.save();
//         }
//       }
//     }
//   } catch (error) {
//     console.error('Error updating hospital after bedspace save:', error);
//     // Don't throw the error to prevent the bedspace save from failing
//   }
// });

// // Modified to use connection to get the model
// BedspaceSchema.post('findOneAndUpdate', async function(doc) {
//   if (doc) {
//     try {
//       // Get the connection from mongoose
//       const connection: Connection = mongoose.connection;
      
//       // Check if Hospital model exists in the connection
//       let HospitalModel;
//       try {
//         // Try to get the existing model
//         HospitalModel = connection.model('Hospital');
//       } catch (error) {
//         // If model doesn't exist, create a minimal schema to avoid errors
//         console.warn('Hospital model not found, creating temporary schema');
//         const tempSchema = new MongooseSchema({
//           _id: MongooseSchema.Types.ObjectId,
//           placeId: String,
//           bedspaces: [{ type: MongooseSchema.Types.ObjectId, ref: 'Bedspace' }]
//         });
        
//         // Add updateBedspaceSummary method to the schema
//         tempSchema.methods.updateBedspaceSummary = async function() {
//           // Add bedspace to the hospital's bedspaces array
//           if (!this.bedspaces.includes(doc._id)) {
//             this.bedspaces.push(doc._id);
//             await this.save();
//           }
//         };
        
//         HospitalModel = connection.model('Hospital', tempSchema);
//       }
      
//       // Find the associated hospital - handle both string IDs and ObjectIds
//       const hospital = await HospitalModel.findOne({
//         $or: [
//           { _id: doc.hospital },
//           { placeId: doc.hospital }
//         ]
//       });
      
//       if (hospital) {
//         if (typeof hospital.updateBedspaceSummary === 'function') {
//           await hospital.updateBedspaceSummary();
//         } else {
//           // Fallback: Update bedspaces array directly
//           if (!hospital.bedspaces.includes(doc._id)) {
//             hospital.bedspaces.push(doc._id);
//             await hospital.save();
//           }
//         }
//       }
//     } catch (error) {
//       console.error('Error updating hospital after bedspace update:', error);
//     }
//   }
// });

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

// Create a function to safely get the Hospital model
const getHospitalModel = () => {
  try {
    // Try to get the model if it's already registered
    return mongoose.model('Hospital');
  } catch (error) {
    // If not registered, create a minimal schema
    const HospitalSchema = new mongoose.Schema({
      _id: mongoose.Schema.Types.ObjectId,
      placeId: String,
      bedspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bedspace' }]
    });
    
    // Add updateBedspaceSummary method
    HospitalSchema.methods.updateBedspaceSummary = async function() {
      // Add bedspace to the hospital's bedspaces array if needed
      // This is a minimal implementation
      console.log('Updating bedspace summary for hospital:', this._id);
    };
    
    // Register and return the model
    return mongoose.model('Hospital', HospitalSchema);
  }
};

// Modified post-save hook
BedspaceSchema.post('save', async function() {
  const bedspace = this as BedspaceDocument;
  
  try {
    // Use the safe getter function
    const HospitalModel = getHospitalModel();
    
    // Find the associated hospital
    const hospital = await HospitalModel.findOne({
      $or: [
        { _id: bedspace.hospital },
        { placeId: bedspace.hospital }
      ]
    });
    
    if (hospital) {
      // Update the hospital
      if (typeof hospital.updateBedspaceSummary === 'function') {
        await hospital.updateBedspaceSummary();
      } else {
        // Fallback: Add bedspace to hospital's bedspaces array
        if (!hospital.bedspaces.includes(bedspace._id)) {
          hospital.bedspaces.push(bedspace._id);
          await hospital.save();
        }
      }
    }
  } catch (error) {
    console.error('Error updating hospital after bedspace save:', error);
  }
});

// Apply the same pattern to other hooks
BedspaceSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    try {
      const HospitalModel = getHospitalModel();
      
      const hospital = await HospitalModel.findOne({
        $or: [
          { _id: doc.hospital },
          { placeId: doc.hospital }
        ]
      });
      
      if (hospital) {
        if (typeof hospital.updateBedspaceSummary === 'function') {
          await hospital.updateBedspaceSummary();
        } else {
          if (!hospital.bedspaces.includes(doc._id)) {
            hospital.bedspaces.push(doc._id);
            await hospital.save();
          }
        }
      }
    } catch (error) {
      console.error('Error updating hospital after bedspace update:', error);
    }
  }
});

// Modified to use connection to get the model
BedspaceSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const bedspace = this as BedspaceDocument;
  if (bedspace.hospital) {
    try {
      // Get the connection from mongoose
      const connection: Connection = mongoose.connection;
      
      // Check if Hospital model exists in the connection
      let HospitalModel;
      try {
        // Try to get the existing model
        HospitalModel = connection.model('Hospital');
      } catch (error) {
        // If model doesn't exist, create a minimal schema to avoid errors
        console.warn('Hospital model not found, creating temporary schema');
        const tempSchema = new MongooseSchema({
          _id: MongooseSchema.Types.ObjectId,
          placeId: String,
          bedspaces: [{ type: MongooseSchema.Types.ObjectId, ref: 'Bedspace' }]
        });
        
        // Add updateBedspaceSummary method to the schema
        tempSchema.methods.updateBedspaceSummary = async function() {
          // Remove bedspace from the hospital's bedspaces array
          this.bedspaces = this.bedspaces.filter(id => !id.equals(bedspace._id));
          await this.save();
        };
        
        HospitalModel = connection.model('Hospital', tempSchema);
      }
      
      // Find the associated hospital - handle both string IDs and ObjectIds
      const hospital = await HospitalModel.findOne({
        $or: [
          { _id: bedspace.hospital },
          { placeId: bedspace.hospital }
        ]
      });
      
      if (hospital) {
        if (typeof hospital.updateBedspaceSummary === 'function') {
          await hospital.updateBedspaceSummary();
        } else {
          // Fallback: Update bedspaces array directly
          hospital.bedspaces = hospital.bedspaces.filter(id => !id.equals(bedspace._id));
          await hospital.save();
        }
      }
    } catch (error) {
      console.error('Error updating hospital after bedspace deletion:', error);
    }
  }
});

// For findOneAndDelete operations - modified to use connection
BedspaceSchema.pre('findOneAndDelete', async function() {
  try {
    // Find the bedspace that will be deleted
    const bedspace = await this.model.findOne(this.getFilter());
    
    if (bedspace && bedspace.hospital) {
      // Generate a unique key for this operation
      const operationId = Date.now().toString() + Math.random().toString();
      
      // Store the hospital ID in our queue (convert to string if it's an ObjectId)
      const hospitalId = typeof bedspace.hospital === 'object' && bedspace.hospital !== null 
        ? bedspace.hospital.toString() 
        : bedspace.hospital;
      
      hospitalUpdateQueue.set(operationId, [hospitalId]);
      
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

// Modified to use connection to get the model
BedspaceSchema.post('findOneAndDelete', async function() {
  try {
    // @ts-ignore - Retrieve the operation ID
    const operationId = this.options?._operationId;
    
    if (operationId && hospitalUpdateQueue.has(operationId)) {
      const hospitalIds = hospitalUpdateQueue.get(operationId) || [];
      hospitalUpdateQueue.delete(operationId); // Clean up
      
      // Get the connection from mongoose
      const connection: Connection = mongoose.connection;
      
      // Check if Hospital model exists in the connection
      let HospitalModel;
      try {
        // Try to get the existing model
        HospitalModel = connection.model('Hospital');
      } catch (error) {
        // If model doesn't exist, create a minimal schema to avoid errors
        console.warn('Hospital model not found, creating temporary schema');
        const tempSchema = new MongooseSchema({
          _id: MongooseSchema.Types.ObjectId,
          placeId: String,
          bedspaces: [{ type: MongooseSchema.Types.ObjectId, ref: 'Bedspace' }]
        });
        
        // Add updateBedspaceSummary method to the schema
        tempSchema.methods.updateBedspaceSummary = async function() {
          // This is a placeholder - in a real app, you'd update summary fields
          console.log('Updating bedspace summary for hospital:', this._id);
        };
        
        HospitalModel = connection.model('Hospital', tempSchema);
      }
      
      for (const hospitalId of hospitalIds) {
        // Find by either _id or placeId
        const hospital = await HospitalModel.findOne({
          $or: [
            { _id: hospitalId },
            { placeId: hospitalId }
          ]
        });
        
        if (hospital) {
          if (typeof hospital.updateBedspaceSummary === 'function') {
            await hospital.updateBedspaceSummary();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in post findOneAndDelete:', error);
  }
});

// Modified for deleteMany operations to use connection
BedspaceSchema.pre('deleteMany', async function() {
  try {
    // Find all bedspaces that will be deleted
    const bedspaces = await this.model.find(this.getFilter(), 'hospital');
    
    if (bedspaces.length > 0) {
      // Extract unique hospital IDs, handling both ObjectId and string
      const hospitalIds = [...new Set(bedspaces.map(b => {
        if (!b.hospital) return null;
        return typeof b.hospital === 'object' && b.hospital !== null 
          ? b.hospital.toString() 
          : b.hospital;
      }).filter(id => id !== null))];
      
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

// Modified to use connection to get the model
BedspaceSchema.post('deleteMany', async function() {
  try {
    // @ts-ignore - Retrieve the operation ID
    const operationId = this.options?._operationId;
    
    if (operationId && hospitalUpdateQueue.has(operationId)) {
      const hospitalIds = hospitalUpdateQueue.get(operationId) || [];
      hospitalUpdateQueue.delete(operationId); // Clean up
      
      // Get the connection from mongoose
      const connection: Connection = mongoose.connection;
      
      // Check if Hospital model exists in the connection
      let HospitalModel;
      try {
        // Try to get the existing model
        HospitalModel = connection.model('Hospital');
      } catch (error) {
        // If model doesn't exist, create a minimal schema to avoid errors
        console.warn('Hospital model not found, creating temporary schema');
        const tempSchema = new MongooseSchema({
          _id: MongooseSchema.Types.ObjectId,
          placeId: String,
          bedspaces: [{ type: MongooseSchema.Types.ObjectId, ref: 'Bedspace' }]
        });
        
        // Add updateBedspaceSummary method to the schema
        tempSchema.methods.updateBedspaceSummary = async function() {
          // This is a placeholder - in a real app, you'd update summary fields
          console.log('Updating bedspace summary for hospital:', this._id);
        };
        
        HospitalModel = connection.model('Hospital', tempSchema);
      }
      
      for (const hospitalId of hospitalIds) {
        // Find by either _id or placeId
        const hospital = await HospitalModel.findOne({
          $or: [
            { _id: hospitalId },
            { placeId: hospitalId }
          ]
        });
        
        if (hospital) {
          if (typeof hospital.updateBedspaceSummary === 'function') {
            await hospital.updateBedspaceSummary();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in post deleteMany:', error);
  }
});

// Modified static method to use connection
BedspaceSchema.statics.updateHospitalBedspaceSummary = async function(hospitalId: string) {
  try {
    // Get the connection from mongoose
    const connection: Connection = mongoose.connection;
    
    // Check if Hospital model exists in the connection
    let HospitalModel;
    try {
      // Try to get the existing model
      HospitalModel = connection.model('Hospital');
    } catch (error) {
      // If model doesn't exist, create a minimal schema to avoid errors
      console.warn('Hospital model not found, creating temporary schema');
      const tempSchema = new MongooseSchema({
        _id: MongooseSchema.Types.ObjectId,
        placeId: String,
        bedspaces: [{ type: MongooseSchema.Types.ObjectId, ref: 'Bedspace' }]
      });
      
      // Add updateBedspaceSummary method to the schema
      tempSchema.methods.updateBedspaceSummary = async function() {
        // This is a placeholder - in a real app, you'd update summary fields
        console.log('Updating bedspace summary for hospital:', this._id);
      };
      
      HospitalModel = connection.model('Hospital', tempSchema);
    }
    
    // Find by either _id or placeId
    const hospital = await HospitalModel.findOne({
      $or: [
        { _id: hospitalId },
        { placeId: hospitalId }
      ]
    });
    
    if (hospital) {
      if (typeof hospital.updateBedspaceSummary === 'function') {
        await hospital.updateBedspaceSummary();
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error in updateHospitalBedspaceSummary:', error);
    return false;
  }
};