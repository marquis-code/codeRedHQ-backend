"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurgePredictionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const surge_prediction_service_1 = require("./surge-prediction.service");
const mongoose_1 = require("mongoose");
let SurgePredictionController = class SurgePredictionController {
    constructor(surgePredictionService) {
        this.surgePredictionService = surgePredictionService;
    }
    async predictSurge(hospitalId) {
        if (!mongoose_1.Types.ObjectId.isValid(hospitalId)) {
            throw new common_1.BadRequestException('Invalid hospital ID format');
        }
        try {
            const predictions = await this.surgePredictionService.predictSurge(hospitalId);
            if (predictions.length === 0) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Insufficient historical data for predictions. At least 24 hours of data required.',
                    data: null
                }, common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                message: 'Surge predictions generated successfully',
                data: {
                    hospitalId,
                    generatedAt: new Date(),
                    totalPredictions: predictions.length,
                    predictions,
                    summary: {
                        highRiskPeriods: predictions.filter(p => p.severity === 'High' || p.severity === 'Critical').length,
                        criticalAlerts: predictions.filter(p => p.severity === 'Critical').length,
                        averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
                    }
                }
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to generate surge predictions',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSurgePatterns(hospitalId, days) {
        if (!mongoose_1.Types.ObjectId.isValid(hospitalId)) {
            throw new common_1.BadRequestException('Invalid hospital ID format');
        }
        const analyzeDays = days ? parseInt(days.toString(), 10) : 30;
        if (isNaN(analyzeDays) || analyzeDays < 1 || analyzeDays > 365) {
            throw new common_1.BadRequestException('Days parameter must be between 1 and 365');
        }
        try {
            const analysis = await this.surgePredictionService.getSurgePatternAnalysis(hospitalId, analyzeDays);
            return {
                success: true,
                message: 'Pattern analysis retrieved successfully',
                data: analysis
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to retrieve pattern analysis',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getHighRiskPeriods(hospitalId) {
        if (!mongoose_1.Types.ObjectId.isValid(hospitalId)) {
            throw new common_1.BadRequestException('Invalid hospital ID format');
        }
        try {
            const predictions = await this.surgePredictionService.predictSurge(hospitalId);
            const highRiskPredictions = predictions.filter(p => p.severity === 'High' || p.severity === 'Critical');
            return {
                success: true,
                message: 'High-risk periods retrieved successfully',
                data: {
                    hospitalId,
                    generatedAt: new Date(),
                    totalHighRiskPeriods: highRiskPredictions.length,
                    criticalAlerts: highRiskPredictions.filter(p => p.severity === 'Critical').length,
                    highAlerts: highRiskPredictions.filter(p => p.severity === 'High').length,
                    periods: highRiskPredictions
                }
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to retrieve high-risk periods',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRecommendations(hospitalId) {
        if (!mongoose_1.Types.ObjectId.isValid(hospitalId)) {
            throw new common_1.BadRequestException('Invalid hospital ID format');
        }
        try {
            const predictions = await this.surgePredictionService.predictSurge(hospitalId);
            if (predictions.length === 0) {
                return {
                    success: true,
                    message: 'Insufficient data for recommendations',
                    data: {
                        recommendations: [],
                        immediateActions: [],
                        preparationActions: []
                    }
                };
            }
            const immediateRiskPeriods = predictions
                .slice(0, 6)
                .filter(p => p.severity === 'High' || p.severity === 'Critical');
            const upcomingRiskPeriods = predictions
                .slice(6)
                .filter(p => p.severity === 'High' || p.severity === 'Critical');
            const allRecommendations = new Set();
            predictions.forEach(p => {
                p.recommendations.forEach(rec => allRecommendations.add(rec));
            });
            const immediateActions = new Set();
            immediateRiskPeriods.forEach(p => {
                p.recommendations.forEach(rec => immediateActions.add(rec));
            });
            const preparationActions = new Set();
            upcomingRiskPeriods.forEach(p => {
                p.recommendations.forEach(rec => preparationActions.add(rec));
            });
            return {
                success: true,
                message: 'Recommendations generated successfully',
                data: {
                    hospitalId,
                    generatedAt: new Date(),
                    immediateRisk: {
                        count: immediateRiskPeriods.length,
                        timeframe: 'Next 6 hours',
                        actions: Array.from(immediateActions)
                    },
                    upcomingRisk: {
                        count: upcomingRiskPeriods.length,
                        timeframe: '6-24 hours',
                        actions: Array.from(preparationActions)
                    },
                    allRecommendations: Array.from(allRecommendations),
                    priorityLevel: immediateRiskPeriods.length > 0 ? 'High' :
                        upcomingRiskPeriods.length > 0 ? 'Medium' : 'Low'
                }
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to generate recommendations',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
__decorate([
    (0, common_1.Get)(':hospitalId/predict'),
    (0, swagger_1.ApiOperation)({
        summary: 'Predict patient surge for next 24 hours',
        description: 'Uses AI/ML to predict potential patient surges based on historical data, time patterns, and trends'
    }),
    (0, swagger_1.ApiParam)({
        name: 'hospitalId',
        description: 'Hospital ID',
        type: String
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Surge predictions retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        hospitalId: { type: 'string' },
                        generatedAt: { type: 'string', format: 'date-time' },
                        predictions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    predictedDate: { type: 'string', format: 'date' },
                                    predictedHour: { type: 'number', example: 14 },
                                    likelihood: { type: 'number', example: 75 },
                                    severity: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
                                    confidence: { type: 'number', example: 0.85 },
                                    factors: {
                                        type: 'object',
                                        properties: {
                                            historicalPattern: { type: 'number' },
                                            dayOfWeek: { type: 'number' },
                                            timeOfDay: { type: 'number' },
                                            seasonality: { type: 'number' },
                                            recentTrend: { type: 'number' }
                                        }
                                    },
                                    recommendations: {
                                        type: 'array',
                                        items: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid hospital ID' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Insufficient data for predictions' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SurgePredictionController.prototype, "predictSurge", null);
__decorate([
    (0, common_1.Get)(':hospitalId/patterns'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get surge pattern analysis',
        description: 'Analyzes historical surge patterns by hour and day of week'
    }),
    (0, swagger_1.ApiParam)({
        name: 'hospitalId',
        description: 'Hospital ID',
        type: String
    }),
    (0, swagger_1.ApiQuery)({
        name: 'days',
        required: false,
        type: Number,
        description: 'Number of days to analyze (default: 30)',
        example: 30
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Pattern analysis retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        period: { type: 'string', example: '30 days' },
                        totalDataPoints: { type: 'number', example: 720 },
                        hourlyPatterns: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    hour: { type: 'number' },
                                    averageVisits: { type: 'number' },
                                    maxVisits: { type: 'number' },
                                    minVisits: { type: 'number' }
                                }
                            }
                        },
                        dailyPatterns: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    dayOfWeek: { type: 'string' },
                                    averageVisits: { type: 'number' },
                                    maxVisits: { type: 'number' },
                                    minVisits: { type: 'number' }
                                }
                            }
                        },
                        peakHours: { type: 'array' },
                        insights: {
                            type: 'object',
                            properties: {
                                busiestHour: { type: 'number' },
                                quietestHour: { type: 'number' },
                                busiestDay: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid parameters' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], SurgePredictionController.prototype, "getSurgePatterns", null);
__decorate([
    (0, common_1.Get)(':hospitalId/high-risk-periods'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get upcoming high-risk surge periods',
        description: 'Returns only high and critical risk predictions for the next 24 hours'
    }),
    (0, swagger_1.ApiParam)({
        name: 'hospitalId',
        description: 'Hospital ID',
        type: String
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'High-risk periods retrieved successfully'
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid hospital ID' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SurgePredictionController.prototype, "getHighRiskPeriods", null);
__decorate([
    (0, common_1.Get)(':hospitalId/recommendations'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get actionable recommendations based on surge predictions',
        description: 'Provides consolidated recommendations for managing predicted surges'
    }),
    (0, swagger_1.ApiParam)({
        name: 'hospitalId',
        description: 'Hospital ID',
        type: String
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Recommendations retrieved successfully'
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid hospital ID' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SurgePredictionController.prototype, "getRecommendations", null);
SurgePredictionController = __decorate([
    (0, swagger_1.ApiTags)('Surge Prediction'),
    (0, common_1.Controller)('surge-prediction'),
    __metadata("design:paramtypes", [surge_prediction_service_1.SurgePredictionService])
], SurgePredictionController);
exports.SurgePredictionController = SurgePredictionController;
//# sourceMappingURL=surge-prediction.controller.js.map