import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { EmergencyAlertsService } from './emergency-alerts.service';
import { EmergencyAlertsController } from './emergency-alerts.controller';
import { EmergencyAlert, EmergencyAlertSchema } from './schemas/emergency-alerts.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmergencyAlert.name, schema: EmergencyAlertSchema },
    ]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [EmergencyAlertsController],
  providers: [EmergencyAlertsService],
  exports: [EmergencyAlertsService],
})
export class EmergencyAlertsModule {}