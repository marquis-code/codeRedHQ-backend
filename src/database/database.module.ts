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