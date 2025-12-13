import { Model } from 'mongoose';
import { SurgeDataDocument } from '../emr/schemas/emr.schema';
import { MedicalVisitDocument } from '../emr/schemas/emr.schema';
export interface SurgePrediction {
    hospitalId: string;
    predictedDate: Date;
    predictedHour: number;
    likelihood: number;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    confidence: number;
    factors: {
        historicalPattern: number;
        dayOfWeek: number;
        timeOfDay: number;
        seasonality: number;
        recentTrend: number;
    };
    recommendations: string[];
}
export declare class SurgePredictionService {
    private surgeDataModel;
    private medicalVisitModel;
    constructor(surgeDataModel: Model<SurgeDataDocument>, medicalVisitModel: Model<MedicalVisitDocument>);
    private calculateMovingAverage;
    private calculateStdDev;
    predictSurge(hospitalId: string): Promise<SurgePrediction[]>;
    private generateRecommendations;
    getSurgePatternAnalysis(hospitalId: string, days?: number): Promise<any>;
}
