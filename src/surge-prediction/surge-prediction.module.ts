
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SurgePredictionController } from '../surge-prediction/surge-prediction.controller';
import { SurgeData, SurgeDataSchema, MedicalVisitSchema, MedicalVisit } from "../emr/schemas/emr.schema"
import { SurgePredictionService } from './surge-prediction.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SurgeData.name, schema: SurgeDataSchema },
      { name: MedicalVisit.name, schema: MedicalVisitSchema },
    ]),
  ],
  controllers: [SurgePredictionController],
  providers: [SurgePredictionService],
  exports: [SurgePredictionService],
})
export class SurgePredictionModule {}