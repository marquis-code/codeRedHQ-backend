import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  UseGuards,
  HttpStatus,
  HttpException,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SurgePredictionService } from './surge-prediction.service';
import { Types } from 'mongoose';

// Optional: Add authentication guard if you have one
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Surge Prediction')
@Controller('surge-prediction')
// @UseGuards(JwtAuthGuard) // Uncomment if you want to protect these endpoints
export class SurgePredictionController {
  constructor(private readonly surgePredictionService: SurgePredictionService) {}

  @Get(':hospitalId/predict')
  @ApiOperation({ 
    summary: 'Predict patient surge for next 24 hours',
    description: 'Uses AI/ML to predict potential patient surges based on historical data, time patterns, and trends'
  })
  @ApiParam({ 
    name: 'hospitalId', 
    description: 'Hospital ID',
    type: String
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 400, description: 'Invalid hospital ID' })
  @ApiResponse({ status: 404, description: 'Insufficient data for predictions' })
  async predictSurge(@Param('hospitalId') hospitalId: string) {
    // Validate hospital ID
    if (!Types.ObjectId.isValid(hospitalId)) {
      throw new BadRequestException('Invalid hospital ID format');
    }

    try {
      const predictions = await this.surgePredictionService.predictSurge(hospitalId);

      if (predictions.length === 0) {
        throw new HttpException(
          {
            success: false,
            message: 'Insufficient historical data for predictions. At least 24 hours of data required.',
            data: null
          },
          HttpStatus.NOT_FOUND
        );
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to generate surge predictions',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':hospitalId/patterns')
  @ApiOperation({ 
    summary: 'Get surge pattern analysis',
    description: 'Analyzes historical surge patterns by hour and day of week'
  })
  @ApiParam({ 
    name: 'hospitalId', 
    description: 'Hospital ID',
    type: String
  })
  @ApiQuery({ 
    name: 'days', 
    required: false, 
    type: Number, 
    description: 'Number of days to analyze (default: 30)',
    example: 30
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async getSurgePatterns(
    @Param('hospitalId') hospitalId: string,
    @Query('days') days?: number
  ) {
    // Validate hospital ID
    if (!Types.ObjectId.isValid(hospitalId)) {
      throw new BadRequestException('Invalid hospital ID format');
    }

    // Validate days parameter
    const analyzeDays = days ? parseInt(days.toString(), 10) : 30;
    if (isNaN(analyzeDays) || analyzeDays < 1 || analyzeDays > 365) {
      throw new BadRequestException('Days parameter must be between 1 and 365');
    }

    try {
      const analysis = await this.surgePredictionService.getSurgePatternAnalysis(
        hospitalId,
        analyzeDays
      );

      return {
        success: true,
        message: 'Pattern analysis retrieved successfully',
        data: analysis
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve pattern analysis',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':hospitalId/high-risk-periods')
  @ApiOperation({ 
    summary: 'Get upcoming high-risk surge periods',
    description: 'Returns only high and critical risk predictions for the next 24 hours'
  })
  @ApiParam({ 
    name: 'hospitalId', 
    description: 'Hospital ID',
    type: String
  })
  @ApiResponse({ 
    status: 200, 
    description: 'High-risk periods retrieved successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid hospital ID' })
  async getHighRiskPeriods(@Param('hospitalId') hospitalId: string) {
    // Validate hospital ID
    if (!Types.ObjectId.isValid(hospitalId)) {
      throw new BadRequestException('Invalid hospital ID format');
    }

    try {
      const predictions = await this.surgePredictionService.predictSurge(hospitalId);
      
      const highRiskPredictions = predictions.filter(
        p => p.severity === 'High' || p.severity === 'Critical'
      );

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
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve high-risk periods',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':hospitalId/recommendations')
  @ApiOperation({ 
    summary: 'Get actionable recommendations based on surge predictions',
    description: 'Provides consolidated recommendations for managing predicted surges'
  })
  @ApiParam({ 
    name: 'hospitalId', 
    description: 'Hospital ID',
    type: String
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Recommendations retrieved successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid hospital ID' })
  async getRecommendations(@Param('hospitalId') hospitalId: string) {
    // Validate hospital ID
    if (!Types.ObjectId.isValid(hospitalId)) {
      throw new BadRequestException('Invalid hospital ID format');
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

      // Get immediate high-risk periods (next 6 hours)
      const immediateRiskPeriods = predictions
        .slice(0, 6)
        .filter(p => p.severity === 'High' || p.severity === 'Critical');

      // Get upcoming high-risk periods (6-24 hours)
      const upcomingRiskPeriods = predictions
        .slice(6)
        .filter(p => p.severity === 'High' || p.severity === 'Critical');

      // Consolidate unique recommendations
      const allRecommendations = new Set<string>();
      predictions.forEach(p => {
        p.recommendations.forEach(rec => allRecommendations.add(rec));
      });

      const immediateActions = new Set<string>();
      immediateRiskPeriods.forEach(p => {
        p.recommendations.forEach(rec => immediateActions.add(rec));
      });

      const preparationActions = new Set<string>();
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
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to generate recommendations',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}