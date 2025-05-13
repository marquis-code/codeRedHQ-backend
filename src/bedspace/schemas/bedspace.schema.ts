// // import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// // import { Document, Schema as MongooseSchema, model } from 'mongoose';
// // import { Types } from 'mongoose';
// // import { InjectConnection } from '@nestjs/mongoose';

// // // Define the interface for the document, which extends Document and Bedspace
// // export interface BedspaceDocument extends Document, Bedspace {}

// // @Schema({ timestamps: true })
// // export class Bedspace {
// //   @Prop({ 
// //     type: MongooseSchema.Types.Mixed, // Changed from ObjectId to Mixed to accept both string and ObjectId
// //     ref: 'Hospital', 
// //     required: true,
// //     // Add a validator to ensure it's either a string or ObjectId
// //     validate: {
// //       validator: function(v: any) {
// //         // Accept either string (for Google Place IDs) or ObjectId
// //         return typeof v === 'string' || v instanceof Types.ObjectId;
// //       },
// //       message: props => `${props.value} is not a valid hospital identifier!`
// //     }
// //   })
// //   hospital: Types.ObjectId | string;

// //   @Prop({ required: true })
// //   departmentName: string;

// //   @Prop({ required: true })
// //   location: string;

// //   @Prop({ required: true })
// //   totalBeds: number;

// //   @Prop({ required: true, default: 0 })
// //   availableBeds: number;

// //   @Prop({ required: true, default: 0 })
// //   occupiedBeds: number;

// //   @Prop()
// //   lastUpdated: Date;

// //   @Prop({ enum: ['Available', 'Limited', 'Unavailable'], default: 'Available' })
// //   status: string;

// //   @Prop({ type: [{ date: Date, available: Number, occupied: Number }], default: [] })
// //   history: Array<{
// //     date: Date;
// //     available: number;
// //     occupied: number;
// //   }>;
// // }

// // export const BedspaceSchema = SchemaFactory.createForClass(Bedspace);

// // // Store for hospital IDs that need to be updated after operations
// // // This is a simple way to pass context between pre and post hooks
// // const hospitalUpdateQueue = new Map<string, string[]>();

// // // Calculate status based on available beds
// // BedspaceSchema.pre('save', async function (next) {
// //   const bedspace = this as BedspaceDocument;
  
// //   // Update lastUpdated timestamp
// //   bedspace.lastUpdated = new Date();
  
// //   // Calculate occupancy percentage
// //   const occupancyPercentage = (bedspace.occupiedBeds / bedspace.totalBeds) * 100;
  
// //   // Set status based on occupancy
// //   if (bedspace.availableBeds === 0) {
// //     bedspace.status = 'Unavailable';
// //   } else if (occupancyPercentage >= 80) {
// //     bedspace.status = 'Limited';
// //   } else {
// //     bedspace.status = 'Available';
// //   }
  
// //   // Add to history
// //   bedspace.history.push({
// //     date: new Date(),
// //     available: bedspace.availableBeds,
// //     occupied: bedspace.occupiedBeds
// //   });
  
// //   // Limit history to last 100 entries
// //   if (bedspace.history.length > 100) {
// //     bedspace.history = bedspace.history.slice(-100);
// //   }
  
// //   next();
// // });

// // // Modified to handle both string and ObjectId hospital references
// // BedspaceSchema.post('save', async function() {
// //   const bedspace = this as BedspaceDocument;
  
// //   try {
// //     // Get the Hospital model
// //     const HospitalModel = model('Hospital');
    
// //     // Find the associated hospital - handle both string IDs and ObjectIds
// //     const hospital = await HospitalModel.findOne({
// //       $or: [
// //         { _id: bedspace.hospital },
// //         { placeId: bedspace.hospital } // Assuming you have a placeId field in your Hospital model
// //       ]
// //     });
    
// //     if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
// //       // Update the hospital's bedspace summary
// //       await hospital.updateBedspaceSummary();
// //     }
// //   } catch (error) {
// //     console.error('Error updating hospital after bedspace save:', error);
// //     // Don't throw the error to prevent the bedspace save from failing
// //   }
// // });

// // // Modified to handle both string and ObjectId hospital references
// // BedspaceSchema.post('findOneAndUpdate', async function(doc) {
// //   if (doc) {
// //     try {
// //       // Get the Hospital model
// //       const HospitalModel = model('Hospital');
      
// //       // Find the associated hospital - handle both string IDs and ObjectIds
// //       const hospital = await HospitalModel.findOne({
// //         $or: [
// //           { _id: doc.hospital },
// //           { placeId: doc.hospital } // Assuming you have a placeId field in your Hospital model
// //         ]
// //       });
      
// //       if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
// //         // Update the hospital's bedspace summary
// //         await hospital.updateBedspaceSummary();
// //       }
// //     } catch (error) {
// //       console.error('Error updating hospital after bedspace update:', error);
// //     }
// //   }
// // });

// // // Modified to handle both string and ObjectId hospital references
// // BedspaceSchema.pre('deleteOne', { document: true, query: false }, async function() {
// //   const bedspace = this as BedspaceDocument;
// //   if (bedspace.hospital) {
// //     try {
// //       // Get the Hospital model
// //       const HospitalModel = model('Hospital');
      
// //       // Find the associated hospital - handle both string IDs and ObjectIds
// //       const hospital = await HospitalModel.findOne({
// //         $or: [
// //           { _id: bedspace.hospital },
// //           { placeId: bedspace.hospital } // Assuming you have a placeId field in your Hospital model
// //         ]
// //       });
      
// //       if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
// //         // Update the hospital's bedspace summary
// //         await hospital.updateBedspaceSummary();
// //       }
// //     } catch (error) {
// //       console.error('Error updating hospital after bedspace deletion:', error);
// //     }
// //   }
// // });

// // // For findOneAndDelete operations - modified to handle string IDs
// // BedspaceSchema.pre('findOneAndDelete', async function() {
// //   try {
// //     // Find the bedspace that will be deleted
// //     const bedspace = await this.model.findOne(this.getFilter());
    
// //     if (bedspace && bedspace.hospital) {
// //       // Generate a unique key for this operation
// //       const operationId = Date.now().toString() + Math.random().toString();
      
// //       // Store the hospital ID in our queue (convert to string if it's an ObjectId)
// //       const hospitalId = typeof bedspace.hospital === 'object' && bedspace.hospital !== null 
// //         ? bedspace.hospital.toString() 
// //         : bedspace.hospital;
      
// //       hospitalUpdateQueue.set(operationId, [hospitalId]);
      
// //       // Store the operation ID in the query options
// //       // @ts-ignore - This is a valid way to pass data between pre and post hooks
// //       this.options = this.options || {};
// //       // @ts-ignore
// //       this.options._operationId = operationId;
// //     }
// //   } catch (error) {
// //     console.error('Error in pre findOneAndDelete:', error);
// //   }
// // });

// // // Modified to handle string IDs
// // BedspaceSchema.post('findOneAndDelete', async function() {
// //   try {
// //     // @ts-ignore - Retrieve the operation ID
// //     const operationId = this.options?._operationId;
    
// //     if (operationId && hospitalUpdateQueue.has(operationId)) {
// //       const hospitalIds = hospitalUpdateQueue.get(operationId) || [];
// //       hospitalUpdateQueue.delete(operationId); // Clean up
      
// //       // Update each hospital
// //       const HospitalModel = model('Hospital');
      
// //       for (const hospitalId of hospitalIds) {
// //         // Find by either _id or placeId
// //         const hospital = await HospitalModel.findOne({
// //           $or: [
// //             { _id: hospitalId },
// //             { placeId: hospitalId } // Assuming you have a placeId field
// //           ]
// //         });
        
// //         if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
// //           await hospital.updateBedspaceSummary();
// //         }
// //       }
// //     }
// //   } catch (error) {
// //     console.error('Error in post findOneAndDelete:', error);
// //   }
// // });

// // // Modified for deleteMany operations to handle string IDs
// // BedspaceSchema.pre('deleteMany', async function() {
// //   try {
// //     // Find all bedspaces that will be deleted
// //     const bedspaces = await this.model.find(this.getFilter(), 'hospital');
    
// //     if (bedspaces.length > 0) {
// //       // Extract unique hospital IDs, handling both ObjectId and string
// //       const hospitalIds = [...new Set(bedspaces.map(b => {
// //         if (!b.hospital) return null;
// //         return typeof b.hospital === 'object' && b.hospital !== null 
// //           ? b.hospital.toString() 
// //           : b.hospital;
// //       }).filter(id => id !== null))];
      
// //       if (hospitalIds.length > 0) {
// //         // Generate a unique key for this operation
// //         const operationId = Date.now().toString() + Math.random().toString();
        
// //         // Store the hospital IDs in our queue
// //         hospitalUpdateQueue.set(operationId, hospitalIds);
        
// //         // Store the operation ID in the query options
// //         // @ts-ignore - This is a valid way to pass data between pre and post hooks
// //         this.options = this.options || {};
// //         // @ts-ignore
// //         this.options._operationId = operationId;
// //       }
// //     }
// //   } catch (error) {
// //     console.error('Error in pre deleteMany:', error);
// //   }
// // });

// // // Modified to handle string IDs
// // BedspaceSchema.post('deleteMany', async function() {
// //   try {
// //     // @ts-ignore - Retrieve the operation ID
// //     const operationId = this.options?._operationId;
    
// //     if (operationId && hospitalUpdateQueue.has(operationId)) {
// //       const hospitalIds = hospitalUpdateQueue.get(operationId) || [];
// //       hospitalUpdateQueue.delete(operationId); // Clean up
      
// //       // Update each hospital
// //       const HospitalModel = model('Hospital');
      
// //       for (const hospitalId of hospitalIds) {
// //         // Find by either _id or placeId
// //         const hospital = await HospitalModel.findOne({
// //           $or: [
// //             { _id: hospitalId },
// //             { placeId: hospitalId } // Assuming you have a placeId field
// //           ]
// //         });
        
// //         if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
// //           await hospital.updateBedspaceSummary();
// //         }
// //       }
// //     }
// //   } catch (error) {
// //     console.error('Error in post deleteMany:', error);
// //   }
// // });

// // // Modified static method to handle string IDs
// // BedspaceSchema.statics.updateHospitalBedspaceSummary = async function(hospitalId: string) {
// //   try {
// //     const HospitalModel = model('Hospital');
    
// //     // Find by either _id or placeId
// //     const hospital = await HospitalModel.findOne({
// //       $or: [
// //         { _id: hospitalId },
// //         { placeId: hospitalId } // Assuming you have a placeId field
// //       ]
// //     });
    
// //     if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
// //       await hospital.updateBedspaceSummary();
// //       return true;
// //     }
// //     return false;
// //   } catch (error) {
// //     console.error('Error in updateHospitalBedspaceSummary:', error);
// //     return false;
// //   }
// // };


// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Schema as MongooseSchema, Types, Connection } from 'mongoose';
// import { InjectConnection } from '@nestjs/mongoose';

// // Define the interface for the document, which extends Document and Bedspace
// export interface BedspaceDocument extends Document, Bedspace {}

// @Schema({ timestamps: true })
// export class Bedspace {
//   @Prop({ 
//     type: MongooseSchema.Types.Mixed, // Changed from ObjectId to Mixed to accept both string and ObjectId
//     ref: 'Hospital', 
//     required: true,
//     // Add a validator to ensure it's either a string or ObjectId
//     validate: {
//       validator: function(v: any) {
//         // Accept either string (for Google Place IDs) or ObjectId
//         return typeof v === 'string' || v instanceof Types.ObjectId;
//       },
//       message: props => `${props.value} is not a valid hospital identifier!`
//     }
//   })
//   hospital: Types.ObjectId | string;

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

// // Create a function to safely get the Hospital model
// const getHospitalModel = function(this: any) {
//   try {
//     // Try to get the model from the connection
//     return this.model('Hospital');
//   } catch (error) {
//     // If the model isn't registered yet, log the error but don't throw
//     console.error('Hospital model not available:', error.message);
//     return null;
//   }
// };

// // Modified to handle both string and ObjectId hospital references
// BedspaceSchema.post('save', async function() {
//   const bedspace = this as BedspaceDocument;
  
//   try {
//     // Get the Hospital model safely
//     const HospitalModel = getHospitalModel.call(this);
    
//     if (!HospitalModel) {
//       console.log('Hospital model not available, skipping update');
//       return;
//     }
    
//     // Safely handle the hospital ID
//     let hospitalId = bedspace.hospital;
    
//     // If it's an ObjectId, convert to string
//     if (typeof hospitalId === 'object' && hospitalId !== null) {
//       hospitalId = hospitalId.toString();
//     }
    
//     // Validate the ID format
//     if (typeof hospitalId !== 'string') {
//       console.error('Invalid hospital ID format:', hospitalId);
//       return;
//     }
    
//     // Find the associated hospital - handle both string IDs and ObjectIds
//     let hospital;
    
//     // Try to find by ObjectId if it looks like one
//     if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
//       hospital = await HospitalModel.findById(hospitalId);
//     }
    
//     // If not found, try by placeId
//     if (!hospital) {
//       hospital = await HospitalModel.findOne({ placeId: hospitalId });
//     }
    
//     if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
//       // Update the hospital's bedspace summary
//       await hospital.updateBedspaceSummary();
//     } else {
//       console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
//     }
//   } catch (error) {
//     console.error('Error updating hospital after bedspace save:', error);
//     // Don't throw the error to prevent the bedspace save from failing
//   }
// });

// // Modified to handle both string and ObjectId hospital references
// BedspaceSchema.post('findOneAndUpdate', async function(doc) {
//   if (doc) {
//     try {
//       // Get the Hospital model safely
//       const HospitalModel = getHospitalModel.call(this);
      
//       if (!HospitalModel) {
//         console.log('Hospital model not available, skipping update');
//         return;
//       }
      
//       // Safely handle the hospital ID
//       let hospitalId = doc.hospital;
      
//       // If it's an ObjectId, convert to string
//       if (typeof hospitalId === 'object' && hospitalId !== null) {
//         hospitalId = hospitalId.toString();
//       }
      
//       // Validate the ID format
//       if (typeof hospitalId !== 'string') {
//         console.error('Invalid hospital ID format:', hospitalId);
//         return;
//       }
      
//       // Find the associated hospital - handle both string IDs and ObjectIds
//       let hospital;
      
//       // Try to find by ObjectId if it looks like one
//       if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
//         hospital = await HospitalModel.findById(hospitalId);
//       }
      
//       // If not found, try by placeId
//       if (!hospital) {
//         hospital = await HospitalModel.findOne({ placeId: hospitalId });
//       }
      
//       if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
//         // Update the hospital's bedspace summary
//         await hospital.updateBedspaceSummary();
//       } else {
//         console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
//       }
//     } catch (error) {
//       console.error('Error updating hospital after bedspace update:', error);
//     }
//   }
// });

// // Modified to handle both string and ObjectId hospital references
// BedspaceSchema.pre('deleteOne', { document: true, query: false }, async function() {
//   const bedspace = this as BedspaceDocument;
//   if (bedspace.hospital) {
//     try {
//       // Get the Hospital model safely
//       const HospitalModel = getHospitalModel.call(this);
      
//       if (!HospitalModel) {
//         console.log('Hospital model not available, skipping update');
//         return;
//       }
      
//       // Safely handle the hospital ID
//       let hospitalId = bedspace.hospital;
      
//       // If it's an ObjectId, convert to string
//       if (typeof hospitalId === 'object' && hospitalId !== null) {
//         hospitalId = hospitalId.toString();
//       }
      
//       // Validate the ID format
//       if (typeof hospitalId !== 'string') {
//         console.error('Invalid hospital ID format:', hospitalId);
//         return;
//       }
      
//       // Find the associated hospital - handle both string IDs and ObjectIds
//       let hospital;
      
//       // Try to find by ObjectId if it looks like one
//       if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
//         hospital = await HospitalModel.findById(hospitalId);
//       }
      
//       // If not found, try by placeId
//       if (!hospital) {
//         hospital = await HospitalModel.findOne({ placeId: hospitalId });
//       }
      
//       if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
//         // Update the hospital's bedspace summary
//         await hospital.updateBedspaceSummary();
//       } else {
//         console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
//       }
//     } catch (error) {
//       console.error('Error updating hospital after bedspace deletion:', error);
//     }
//   }
// });

// // For findOneAndDelete operations - modified to handle string IDs
// BedspaceSchema.pre('findOneAndDelete', async function() {
//   try {
//     // Find the bedspace that will be deleted
//     const bedspace = await this.model.findOne(this.getFilter());
    
//     if (bedspace && bedspace.hospital) {
//       // Generate a unique key for this operation
//       const operationId = Date.now().toString() + Math.random().toString();
      
//       // Store the hospital ID in our queue (convert to string if it's an ObjectId)
//       const hospitalId = typeof bedspace.hospital === 'object' && bedspace.hospital !== null 
//         ? bedspace.hospital.toString() 
//         : bedspace.hospital;
      
//       // Store the operation ID in the query options
//       // @ts-ignore - This is a valid way to pass data between pre and post hooks
//       this.options = this.options || {};
//       // @ts-ignore
//       this.options._operationId = operationId;
//       // @ts-ignore
//       this.options._hospitalId = hospitalId;
//     }
//   } catch (error) {
//     console.error('Error in pre findOneAndDelete:', error);
//   }
// });

// // Modified to handle string IDs
// BedspaceSchema.post('findOneAndDelete', async function() {
//   try {
//     // @ts-ignore - Retrieve the operation ID and hospital ID
//     const hospitalId = this.options?._hospitalId;
    
//     if (hospitalId) {
//       // Get the Hospital model safely
//       const HospitalModel = getHospitalModel.call(this);
      
//       if (!HospitalModel) {
//         console.log('Hospital model not available, skipping update');
//         return;
//       }
      
//       // Find the associated hospital - handle both string IDs and ObjectIds
//       let hospital;
      
//       // Try to find by ObjectId if it looks like one
//       if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
//         hospital = await HospitalModel.findById(hospitalId);
//       }
      
//       // If not found, try by placeId
//       if (!hospital) {
//         hospital = await HospitalModel.findOne({ placeId: hospitalId });
//       }
      
//       if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
//         await hospital.updateBedspaceSummary();
//       } else {
//         console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
//       }
//     }
//   } catch (error) {
//     console.error('Error in post findOneAndDelete:', error);
//   }
// });

// // Modified for deleteMany operations to handle string IDs
// BedspaceSchema.pre('deleteMany', async function() {
//   try {
//     // Find all bedspaces that will be deleted
//     const bedspaces = await this.model.find(this.getFilter(), 'hospital');
    
//     if (bedspaces.length > 0) {
//       // Extract unique hospital IDs, handling both ObjectId and string
//       const hospitalIds = [...new Set(bedspaces.map(b => {
//         if (!b.hospital) return null;
//         return typeof b.hospital === 'object' && b.hospital !== null 
//           ? b.hospital.toString() 
//           : b.hospital;
//       }).filter(id => id !== null))];
      
//       if (hospitalIds.length > 0) {
//         // Store the hospital IDs in the query options
//         // @ts-ignore - This is a valid way to pass data between pre and post hooks
//         this.options = this.options || {};
//         // @ts-ignore
//         this.options._hospitalIds = hospitalIds;
//       }
//     }
//   } catch (error) {
//     console.error('Error in pre deleteMany:', error);
//   }
// });

// // Modified to handle string IDs
// BedspaceSchema.post('deleteMany', async function() {
//   try {
//     // @ts-ignore - Retrieve the hospital IDs
//     const hospitalIds = this.options?._hospitalIds || [];
    
//     if (hospitalIds.length > 0) {
//       // Get the Hospital model safely
//       const HospitalModel = getHospitalModel.call(this);
      
//       if (!HospitalModel) {
//         console.log('Hospital model not available, skipping update');
//         return;
//       }
      
//       // Update each hospital
//       for (const hospitalId of hospitalIds) {
//         // Find the associated hospital - handle both string IDs and ObjectIds
//         let hospital;
        
//         // Try to find by ObjectId if it looks like one
//         if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
//           hospital = await HospitalModel.findById(hospitalId);
//         }
        
//         // If not found, try by placeId
//         if (!hospital) {
//           hospital = await HospitalModel.findOne({ placeId: hospitalId });
//         }
        
//         if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
//           await hospital.updateBedspaceSummary();
//         } else {
//           console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
//         }
//       }
//     }
//   } catch (error) {
//     console.error('Error in post deleteMany:', error);
//   }
// });

// // Modified static method to handle string IDs
// BedspaceSchema.statics.updateHospitalBedspaceSummary = async function(hospitalId: string) {
//   try {
//     // Get the Hospital model safely
//     const HospitalModel = getHospitalModel.call(this);
    
//     if (!HospitalModel) {
//       console.log('Hospital model not available, skipping update');
//       return false;
//     }
    
//     // Find the associated hospital - handle both string IDs and ObjectIds
//     let hospital;
    
//     // Try to find by ObjectId if it looks like one
//     if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
//       hospital = await HospitalModel.findById(hospitalId);
//     }
    
//     // If not found, try by placeId
//     if (!hospital) {
//       hospital = await HospitalModel.findOne({ placeId: hospitalId });
//     }
    
//     if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
//       await hospital.updateBedspaceSummary();
//       return true;
//     }
//     return false;
//   } catch (error) {
//     console.error('Error in updateHospitalBedspaceSummary:', error);
//     return false;
//   }
// };


// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Schema as MongooseSchema, Types, Connection } from 'mongoose';
// import { InjectConnection } from '@nestjs/mongoose';

// // Define the interface for the document, which extends Document and Bedspace
// export interface BedspaceDocument extends Document, Bedspace {}

// @Schema({ timestamps: true })
// export class Bedspace {
//   @Prop({ 
//     type: MongooseSchema.Types.Mixed, // Changed from ObjectId to Mixed to accept both string and ObjectId
//     ref: 'Hospital', 
//     required: true,
//     // Add a validator to ensure it's either a string or ObjectId
//     validate: {
//       validator: function(v: any) {
//         // Accept either string (for Google Place IDs) or ObjectId
//         return typeof v === 'string' || v instanceof Types.ObjectId;
//       },
//       message: props => `${props.value} is not a valid hospital identifier!`
//     }
//   })
//   hospital: Types.ObjectId | string;

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

// // Create a function to safely get the Hospital model
// const getHospitalModel = function(this: any) {
//   try {
//     // Try to get the model from the connection
//     return this.model('Hospital');
//   } catch (error) {
//     // If the model isn't registered yet, log the error but don't throw
//     console.error('Hospital model not available:', error.message);
//     return null;
//   }
// };

// // Modified to handle both string and ObjectId hospital references
// BedspaceSchema.post('save', async function() {
//   const bedspace = this as BedspaceDocument;
  
//   try {
//     // Get the Hospital model safely
//     const HospitalModel = getHospitalModel.call(this);
    
//     if (!HospitalModel) {
//       console.log('Hospital model not available, skipping update');
//       return;
//     }
    
//     // Safely handle the hospital ID
//     let hospitalId = bedspace.hospital;
    
//     // If it's an ObjectId, convert to string
//     if (typeof hospitalId === 'object' && hospitalId !== null) {
//       hospitalId = hospitalId.toString();
//     }
    
//     // Validate the ID format
//     if (typeof hospitalId !== 'string') {
//       console.error('Invalid hospital ID format:', hospitalId);
//       return;
//     }
    
//     // Find the associated hospital - handle both string IDs and ObjectIds
//     let hospital;
    
//     // Try to find by ObjectId if it looks like one
//     if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
//       hospital = await HospitalModel.findById(hospitalId);
//     }
    
//     // If not found, try by placeId
//     if (!hospital) {
//       hospital = await HospitalModel.findOne({ placeId: hospitalId });
//     }
    
//     if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
//       // Update the hospital's bedspace summary
//       await hospital.updateBedspaceSummary();
//     } else {
//       console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
//     }
//   } catch (error) {
//     console.error('Error updating hospital after bedspace save:', error);
//     // Don't throw the error to prevent the bedspace save from failing
//   }
// });

// // Modified to handle both string and ObjectId hospital references
// BedspaceSchema.post('findOneAndUpdate', async function(doc) {
//   if (doc) {
//     try {
//       // Get the Hospital model safely
//       const HospitalModel = getHospitalModel.call(this);
      
//       if (!HospitalModel) {
//         console.log('Hospital model not available, skipping update');
//         return;
//       }
      
//       // Safely handle the hospital ID
//       let hospitalId = doc.hospital;
      
//       // If it's an ObjectId, convert to string
//       if (typeof hospitalId === 'object' && hospitalId !== null) {
//         hospitalId = hospitalId.toString();
//       }
      
//       // Validate the ID format
//       if (typeof hospitalId !== 'string') {
//         console.error('Invalid hospital ID format:', hospitalId);
//         return;
//       }
      
//       // Find the associated hospital - handle both string IDs and ObjectIds
//       let hospital;
      
//       // Try to find by ObjectId if it looks like one
//       if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
//         hospital = await HospitalModel.findById(hospitalId);
//       }
      
//       // If not found, try by placeId
//       if (!hospital) {
//         hospital = await HospitalModel.findOne({ placeId: hospitalId });
//       }
      
//       if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
//         // Update the hospital's bedspace summary
//         await hospital.updateBedspaceSummary();
//       } else {
//         console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
//       }
//     } catch (error) {
//       console.error('Error updating hospital after bedspace update:', error);
//     }
//   }
// });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types, model } from 'mongoose';
import mongoose from 'mongoose';

// Define the interface for the document, which extends Document and Bedspace
export interface BedspaceDocument extends Document, Bedspace {}

@Schema({ timestamps: true })
export class Bedspace {
  @Prop({ 
    type: MongooseSchema.Types.Mixed,
    ref: 'Hospital', 
    required: true,
    validate: {
      validator: function(v: any) {
        return typeof v === 'string' || v instanceof Types.ObjectId;
      },
      message: props => `${props.value} is not a valid hospital identifier!`
    }
  })
  hospital: Types.ObjectId | string;

  // Rest of your schema properties...
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

// Helper function to safely get the Hospital model
const getHospitalModel = function() {
  try {
    // Try to get the model if it's already registered
    if (mongoose.modelNames().includes('Hospital')) {
      return mongoose.model('Hospital');
    }
    
    // If not registered yet, try to get it from the connection
    const connection = mongoose.connection;
    if (connection && connection.models && connection.models.Hospital) {
      return connection.models.Hospital;
    }
    
    console.error('Hospital model not available: Schema hasn\'t been registered for model "Hospital".');
    return null;
  } catch (error) {
    console.error('Hospital model not available:', error.message);
    return null;
  }
};

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

// Helper function to safely find a hospital by ID
const findHospitalById = async function(hospitalId: string | Types.ObjectId) {
  try {
    const HospitalModel = getHospitalModel();
    if (!HospitalModel) {
      console.log('Hospital model not available, skipping update');
      return null;
    }

    // Convert ObjectId to string if needed
    const hospitalIdStr = typeof hospitalId === 'object' && hospitalId !== null 
      ? hospitalId.toString() 
      : hospitalId;

    // Skip if invalid ID
    if (typeof hospitalIdStr !== 'string') {
      console.error('Invalid hospital ID format:', hospitalId);
      return null;
    }

    let hospital;
    
    // Try to find by ObjectId if it looks like one
    if (/^[0-9a-fA-F]{24}$/.test(hospitalIdStr)) {
      hospital = await HospitalModel.findById(hospitalIdStr)
        .maxTimeMS(5000)
        .exec();
    }
    
    // If not found, try by placeId
    if (!hospital) {
      hospital = await HospitalModel.findOne({ placeId: hospitalIdStr })
        .maxTimeMS(5000)
        .exec();
    }

    return hospital;
  } catch (error) {
    console.error('Error finding hospital:', error);
    return null;
  }
};

// Modified to handle both string and ObjectId hospital references
BedspaceSchema.post('save', async function() {
  const bedspace = this as BedspaceDocument;
  
  try {
    // Delay the hospital update to ensure the Hospital model is registered
    setTimeout(async () => {
      try {
        const hospital = await findHospitalById(bedspace.hospital);
        
        if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
          await hospital.updateBedspaceSummary();
        } else if (hospital) {
          console.log(`updateBedspaceSummary method not available for hospital: ${hospital._id}`);
        }
      } catch (error) {
        console.error('Error updating hospital after bedspace save (delayed):', error);
      }
    }, 1000); // 1-second delay
  } catch (error) {
    console.error('Error updating hospital after bedspace save:', error);
  }
});

// Modified to handle both string and ObjectId hospital references
BedspaceSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    try {
      // Delay the hospital update to ensure the Hospital model is registered
      setTimeout(async () => {
        try {
          const hospital = await findHospitalById(doc.hospital);
          
          if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
            await hospital.updateBedspaceSummary();
          } else if (hospital) {
            console.log(`updateBedspaceSummary method not available for hospital: ${hospital._id}`);
          }
        } catch (error) {
          console.error('Error updating hospital after bedspace update (delayed):', error);
        }
      }, 1000); // 1-second delay
    } catch (error) {
      console.error('Error updating hospital after bedspace update:', error);
    }
  }
});

// Modified to handle both string and ObjectId hospital references
BedspaceSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const bedspace = this as BedspaceDocument;
  if (bedspace.hospital) {
    try {
      // Get the Hospital model safely
      const HospitalModel = getHospitalModel.call(this);
      
      if (!HospitalModel) {
        console.log('Hospital model not available, skipping update');
        return;
      }
      
      // Safely handle the hospital ID
      let hospitalId = bedspace.hospital;
      
      // If it's an ObjectId, convert to string
      if (typeof hospitalId === 'object' && hospitalId !== null) {
        hospitalId = hospitalId.toString();
      }
      
      // Validate the ID format
      if (typeof hospitalId !== 'string') {
        console.error('Invalid hospital ID format:', hospitalId);
        return;
      }
      
      // Find the associated hospital - handle both string IDs and ObjectIds
      let hospital;
      
      // Try to find by ObjectId if it looks like one
      if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
        hospital = await HospitalModel.findById(hospitalId);
      }
      
      // If not found, try by placeId
      if (!hospital) {
        hospital = await HospitalModel.findOne({ placeId: hospitalId });
      }
      
      if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
        // Update the hospital's bedspace summary
        await hospital.updateBedspaceSummary();
      } else {
        console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
      }
    } catch (error) {
      console.error('Error updating hospital after bedspace deletion:', error);
    }
  }
});

// For findOneAndDelete operations - modified to handle string IDs
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
      
      // Store the operation ID in the query options
      // @ts-ignore - This is a valid way to pass data between pre and post hooks
      this.options = this.options || {};
      // @ts-ignore
      this.options._operationId = operationId;
      // @ts-ignore
      this.options._hospitalId = hospitalId;
    }
  } catch (error) {
    console.error('Error in pre findOneAndDelete:', error);
  }
});

// Modified to handle string IDs
BedspaceSchema.post('findOneAndDelete', async function() {
  try {
    // @ts-ignore - Retrieve the operation ID and hospital ID
    const hospitalId = this.options?._hospitalId;
    
    if (hospitalId) {
      // Get the Hospital model safely
      const HospitalModel = getHospitalModel.call(this);
      
      if (!HospitalModel) {
        console.log('Hospital model not available, skipping update');
        return;
      }
      
      // Find the associated hospital - handle both string IDs and ObjectIds
      let hospital;
      
      // Try to find by ObjectId if it looks like one
      if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
        hospital = await HospitalModel.findById(hospitalId);
      }
      
      // If not found, try by placeId
      if (!hospital) {
        hospital = await HospitalModel.findOne({ placeId: hospitalId });
      }
      
      if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
        await hospital.updateBedspaceSummary();
      } else {
        console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
      }
    }
  } catch (error) {
    console.error('Error in post findOneAndDelete:', error);
  }
});

// Modified for deleteMany operations to handle string IDs
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
        // Store the hospital IDs in the query options
        // @ts-ignore - This is a valid way to pass data between pre and post hooks
        this.options = this.options || {};
        // @ts-ignore
        this.options._hospitalIds = hospitalIds;
      }
    }
  } catch (error) {
    console.error('Error in pre deleteMany:', error);
  }
});

// Modified to handle string IDs
BedspaceSchema.post('deleteMany', async function() {
  try {
    // @ts-ignore - Retrieve the hospital IDs
    const hospitalIds = this.options?._hospitalIds || [];
    
    if (hospitalIds.length > 0) {
      // Get the Hospital model safely
      const HospitalModel = getHospitalModel.call(this);
      
      if (!HospitalModel) {
        console.log('Hospital model not available, skipping update');
        return;
      }
      
      // Update each hospital
      for (const hospitalId of hospitalIds) {
        // Find the associated hospital - handle both string IDs and ObjectIds
        let hospital;
        
        // Try to find by ObjectId if it looks like one
        if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
          hospital = await HospitalModel.findById(hospitalId);
        }
        
        // If not found, try by placeId
        if (!hospital) {
          hospital = await HospitalModel.findOne({ placeId: hospitalId });
        }
        
        if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
          await hospital.updateBedspaceSummary();
        } else {
          console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in post deleteMany:', error);
  }
});

// Modified static method to handle string IDs
BedspaceSchema.statics.updateHospitalBedspaceSummary = async function(hospitalId: string) {
  try {
    // Get the Hospital model safely
    const HospitalModel = getHospitalModel.call(this);
    
    if (!HospitalModel) {
      console.log('Hospital model not available, skipping update');
      return false;
    }
    
    // Find the associated hospital - handle both string IDs and ObjectIds
    let hospital;
    
    // Try to find by ObjectId if it looks like one
    if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
      hospital = await HospitalModel.findById(hospitalId);
    }
    
    // If not found, try by placeId
    if (!hospital) {
      hospital = await HospitalModel.findOne({ placeId: hospitalId });
    }
    
    if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
      await hospital.updateBedspaceSummary();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in updateHospitalBedspaceSummary:', error);
    return false;
  }
};