import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from './auth/auth.module';
import { HospitalModule } from './hospital/hospital.module';
import { UserModule } from './user/user.module';
import { BedspaceModule } from './bedspace/bedspace.module';
import { StaffingModule } from './staffing/staff.module';
import { EmergencyAlertsModule } from './emergency-alerts/emergency-alerts.module';
import { ReportsModule } from './reports/reports.module';
import { MapModule } from './map/map.module';
import { WebsocketModule } from './websocket/websocket.module';
import { AuditModule } from './audit/audit.module'; // Add this line
import { SurgeModule } from './surge/surge.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV || 'development'}`],
    }),
    
    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URL'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),
    
    // // Rate limiting
    // ThrottlerModule.forRoot({
    //   ttl: 60,
    //   limit: 100,
    // }),
    
    // Event emitter for application events
    EventEmitterModule.forRoot({
      // Set this to true for better performance with many listeners
      wildcard: true,
      // Increase max listeners for better performance
      maxListeners: 20,
      // Enable verbose error handling
      verboseMemoryLeak: true,
    }),
    
    // Application modules
    AuthModule,
    DatabaseModule,
    HospitalModule,
    BedspaceModule,
    StaffingModule,
    EmergencyAlertsModule,
    ReportsModule,
    MapModule,
    WebsocketModule,
    AuditModule, // Add this line
    UserModule,
    SurgeModule
  ],
})
export class AppModule {}