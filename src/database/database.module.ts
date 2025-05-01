// import { Module, OnModuleInit } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { InjectConnection } from '@nestjs/mongoose';
// import { Connection } from 'mongoose';
// import { ConfigModule, ConfigService } from '@nestjs/config';

// @Module({
//   imports: [
//     MongooseModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/codered',
//       }),
//     }),
//   ],
// })
// export class DatabaseModule implements OnModuleInit {
//   constructor(@InjectConnection() private readonly connection: Connection) {}

//   async onModuleInit() {
//     try {
//       // Check if the uuid index exists on the hospitals collection
//       const collections = await this.connection.db.listCollections().toArray();
//       const hospitalsCollection = collections.find(c => c.name === 'hospitals');
      
//       if (hospitalsCollection) {
//         const indexes = await this.connection.db.collection('hospitals').indexes();
//         const uuidIndex = indexes.find(index => index.key && index.key.uuid !== undefined);
        
//         if (uuidIndex) {
//           console.log('Found uuid index, dropping...');
//           await this.connection.db.collection('hospitals').dropIndex(uuidIndex.name);
//           console.log('Successfully dropped uuid index');
//         }
//       }
//     } catch (error) {
//       console.error('Error during database initialization:', error);
//     }
//   }
// }

import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';

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
        };
      },
    }),
  ],
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
      
      // IMPORTANT: Remove any code that accesses listCollections
      // Comment out or remove the line that's causing the error (line 24)
      // this.something.listCollections() - REMOVE THIS
      
      this.logger.log('Database initialization complete');
    } catch (error) {
      this.logger.error(`Error during database initialization: ${error.message}`);
      // Log the error but don't rethrow to allow application to start
    }
  }
}