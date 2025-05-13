// import { Module, OnModuleInit, Logger } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import mongoose from 'mongoose';

// @Module({
//   imports: [
//     MongooseModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => {
//         const mongoUri = configService.get<string>('MONGO_URL');
        
//         if (!mongoUri) {
//           throw new Error('MONGO_URL environment variable is not defined');
//         }
        
//         return {
//           uri: mongoUri,
//           useNewUrlParser: true,
//           useUnifiedTopology: true,
//           connectTimeoutMS: 30000,
//           socketTimeoutMS: 30000,
//           serverSelectionTimeoutMS: 30000,
//         };
//       },
//     }),
//   ],
// })
// export class DatabaseModule implements OnModuleInit {
//   private readonly logger = new Logger(DatabaseModule.name);

//   constructor(private readonly configService: ConfigService) {}

//   async onModuleInit() {
//     try {
//       const mongoUri = this.configService.get<string>('MONGO_URL');
      
//       if (!mongoUri) {
//         throw new Error('MONGO_URL environment variable is not defined');
//       }
      
//       this.logger.log(`Database connection initialized with URI: ${mongoUri}`);
      
//       this.logger.log('Database initialization complete');
//     } catch (error) {
//       this.logger.error(`Error during database initialization: ${error.message}`);
//       // Log the error but don't rethrow to allow application to start
//     }
//   }
// }


// import { Module, OnModuleInit, Logger, Global } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import mongoose from 'mongoose';
// import { Hospital, HospitalSchema } from '../hospital/schemas/hospital.schema';
// import { Bedspace, BedspaceSchema } from '../bedspace/schemas/bedspace.schema';

// @Global()
// @Module({
//   imports: [
//     MongooseModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => {
//         const mongoUri = configService.get<string>('MONGO_URL');
        
//         if (!mongoUri) {
//           throw new Error('MONGO_URL environment variable is not defined');
//         }
        
//         return {
//           uri: mongoUri,
//           useNewUrlParser: true,
//           useUnifiedTopology: true,
//           connectTimeoutMS: 30000,
//           socketTimeoutMS: 60000,
//           serverSelectionTimeoutMS: 30000,
//           maxPoolSize: 50,
//           minPoolSize: 10,
//           maxIdleTimeMS: 30000,
//           heartbeatFrequencyMS: 10000,
//           retryWrites: true,
//           retryReads: true,
//         };
//       },
//     }),
//     MongooseModule.forFeature([
//       { name: Hospital.name, schema: HospitalSchema },
//       { name: Bedspace.name, schema: BedspaceSchema },
//     ]),
//   ],
//   exports: [MongooseModule],
// })
// export class DatabaseModule implements OnModuleInit {
//   private readonly logger = new Logger(DatabaseModule.name);

//   constructor(private readonly configService: ConfigService) {}

//   async onModuleInit() {
//     try {
//       const mongoUri = this.configService.get<string>('MONGO_URL');
      
//       if (!mongoUri) {
//         throw new Error('MONGO_URL environment variable is not defined');
//       }
      
//       this.logger.log(`Database connection initialized with URI: ${mongoUri}`);
      
//       // Set global Mongoose options
//       mongoose.set('debug', process.env.NODE_ENV !== 'production');
      
//       // Add connection event listeners
//       mongoose.connection.on('connected', () => {
//         this.logger.log('MongoDB connected successfully');
        
//         // Register models globally after connection is established
//         this.registerModelsGlobally();
//       });
      
//       mongoose.connection.on('error', (err) => {
//         this.logger.error(`MongoDB connection error: ${err}`);
//       });
      
//       mongoose.connection.on('disconnected', () => {
//         this.logger.warn('MongoDB disconnected');
//       });
      
//       this.logger.log('Database initialization complete');
//     } catch (error) {
//       this.logger.error(`Error during database initialization: ${error.message}`);
//     }
//   }

//   private registerModelsGlobally() {
//     try {
//       // Register Hospital model globally
//       if (!mongoose.modelNames().includes('Hospital')) {
//         mongoose.model('Hospital', HospitalSchema);
//         this.logger.log('Hospital model registered globally');
//       }

//       // Register Bedspace model globally
//       if (!mongoose.modelNames().includes('Bedspace')) {
//         mongoose.model('Bedspace', BedspaceSchema);
//         this.logger.log('Bedspace model registered globally');
//       }
//     } catch (error) {
//       this.logger.error(`Error registering models globally: ${error.message}`);
//     }
//   }
// }
import { Module, OnModuleInit, Logger, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';

@Global() // Make this module global
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mongoUri = configService.get<string>('MONGO_URL');
        
        if (!mongoUri) {
          throw new Error('MONGO_URL environment variable is not defined');
        }
        
        return {
          uri: mongoUri,
          useNewUrlParser: true,
          useUnifiedTopology: true,
          connectTimeoutMS: 30000,
          socketTimeoutMS: 60000, // Increased from 30000
          serverSelectionTimeoutMS: 30000,
          maxPoolSize: 50, // Add connection pooling
          minPoolSize: 10, // Maintain minimum connections
          maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
          // Add heartbeat to keep connections alive
          heartbeatFrequencyMS: 10000,
          // Add retry mechanism
          retryWrites: true,
          retryReads: true,
        };
      },
    }),
  ],
  exports: [MongooseModule], // Export MongooseModule
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const mongoUri = this.configService.get<string>('MONGO_URL');
      
      if (!mongoUri) {
        throw new Error('MONGO_URL environment variable is not defined');
      }
      
      this.logger.log(`Database connection initialized with URI: ${mongoUri}`);
      
      // Set global Mongoose options
      mongoose.set('debug', process.env.NODE_ENV !== 'production'); // Log queries in non-production
      
      // Add connection event listeners
      mongoose.connection.on('connected', () => {
        this.logger.log('MongoDB connected successfully');
      });
      
      mongoose.connection.on('error', (err) => {
        this.logger.error(`MongoDB connection error: ${err}`);
      });
      
      mongoose.connection.on('disconnected', () => {
        this.logger.warn('MongoDB disconnected');
      });
      
      this.logger.log('Database initialization complete');
    } catch (error) {
      this.logger.error(`Error during database initialization: ${error.message}`);
      // Log the error but don't rethrow to allow application to start
    }
  }
}