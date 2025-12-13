import { SurgePredictionService } from './surge-prediction.service';
export declare class SurgePredictionController {
    private readonly surgePredictionService;
    constructor(surgePredictionService: SurgePredictionService);
    predictSurge(hospitalId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            hospitalId: string;
            generatedAt: Date;
            totalPredictions: number;
            predictions: import("./surge-prediction.service").SurgePrediction[];
            summary: {
                highRiskPeriods: number;
                criticalAlerts: number;
                averageConfidence: number;
            };
        };
    }>;
    getSurgePatterns(hospitalId: string, days?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getHighRiskPeriods(hospitalId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            hospitalId: string;
            generatedAt: Date;
            totalHighRiskPeriods: number;
            criticalAlerts: number;
            highAlerts: number;
            periods: import("./surge-prediction.service").SurgePrediction[];
        };
    }>;
    getRecommendations(hospitalId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            recommendations: any[];
            immediateActions: any[];
            preparationActions: any[];
            hospitalId?: undefined;
            generatedAt?: undefined;
            immediateRisk?: undefined;
            upcomingRisk?: undefined;
            allRecommendations?: undefined;
            priorityLevel?: undefined;
        };
    } | {
        success: boolean;
        message: string;
        data: {
            hospitalId: string;
            generatedAt: Date;
            immediateRisk: {
                count: number;
                timeframe: string;
                actions: string[];
            };
            upcomingRisk: {
                count: number;
                timeframe: string;
                actions: string[];
            };
            allRecommendations: string[];
            priorityLevel: string;
            recommendations?: undefined;
            immediateActions?: undefined;
            preparationActions?: undefined;
        };
    }>;
}
