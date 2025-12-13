// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { SurgeData, SurgeDataDocument } from '../emr/schemas/emr.schema';
// import { MedicalVisit, MedicalVisitDocument } from '../emr/schemas/emr.schema';

// interface SurgePrediction {
//   hospitalId: string;
//   predictedDate: Date;
//   predictedHour: number;
//   likelihood: number; // 0-100
//   severity: 'Low' | 'Medium' | 'High' | 'Critical';
//   confidence: number; // 0-1
//   factors: {
//     historicalPattern: number;
//     dayOfWeek: number;
//     timeOfDay: number;
//     seasonality: number;
//     recentTrend: number;
//   };
//   recommendations: string[];
// }

// @Injectable()
// export class SurgePredictionService {
//   constructor(
//     @InjectModel(SurgeData.name) private surgeDataModel: Model<SurgeDataDocument>,
//     @InjectModel(MedicalVisit.name) private medicalVisitModel: Model<MedicalVisitDocument>,
//   ) {}

//   // Calculate moving average
//   private calculateMovingAverage(data: number[], window: number): number {
//     if (data.length < window) return data.reduce((a, b) => a + b, 0) / data.length;
//     const recent = data.slice(-window);
//     return recent.reduce((a, b) => a + b, 0) / window;
//   }

//   // Calculate standard deviation
//   private calculateStdDev(data: number[]): number {
//     const mean = data.reduce((a, b) => a + b, 0) / data.length;
//     const squareDiffs = data.map(value => Math.pow(value - mean, 2));
//     const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / data.length;
//     return Math.sqrt(avgSquareDiff);
//   }

//   // Predict surge for next 24 hours
//   async predictSurge(hospitalId: string): Promise<SurgePrediction[]> {
//     const now = new Date();
//     const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

//     // Get historical data
//     const historicalData = await this.surgeDataModel
//       .find({
//         hospital: new Types.ObjectId(hospitalId),
//         date: { $gte: thirtyDaysAgo },
//       })
//       .sort({ date: 1, hour: 1 })
//       .exec();

//     if (historicalData.length < 24) {
//       // Not enough data for meaningful predictions
//       return [];
//     }

//     // Organize data by hour of day
//     const hourlyPatterns: Record<number, number[]> = {};
//     const dayOfWeekPatterns: Record<string, number[]> = {};

//     for (let i = 0; i < 24; i++) {
//       hourlyPatterns[i] = [];
//     }

//     historicalData.forEach(record => {
//       const hour = record.hour;
//       const dayOfWeek = record.dayOfWeek;

//       hourlyPatterns[hour].push(record.totalVisits);

//       if (!dayOfWeekPatterns[dayOfWeek]) {
//         dayOfWeekPatterns[dayOfWeek] = [];
//       }
//       dayOfWeekPatterns[dayOfWeek].push(record.totalVisits);
//     });

//     // Calculate overall average and standard deviation
//     const allVisits = historicalData.map(r => r.totalVisits);
//     const overallAvg = allVisits.reduce((a, b) => a + b, 0) / allVisits.length;
//     const overallStdDev = this.calculateStdDev(allVisits);

//     // Calculate recent trend (last 7 days vs previous 7 days)
//     const recentSevenDays = historicalData.slice(-7 * 24);
//     const previousSevenDays = historicalData.slice(-14 * 24, -7 * 24);

//     const recentAvg = recentSevenDays.length
//       ? recentSevenDays.reduce((sum, r) => sum + r.totalVisits, 0) / recentSevenDays.length
//       : overallAvg;

//     const previousAvg = previousSevenDays.length
//       ? previousSevenDays.reduce((sum, r) => sum + r.totalVisits, 0) / previousSevenDays.length
//       : overallAvg;

//     const trendFactor = recentAvg / previousAvg;

//     // Generate predictions for next 24 hours
//     const predictions: SurgePrediction[] = [];
//     const currentDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

//     for (let hourOffset = 1; hourOffset <= 24; hourOffset++) {
//       const predictedTime = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
//       const predictedHour = predictedTime.getHours();
//       const predictedDayOfWeek = predictedTime.toLocaleDateString('en-US', { weekday: 'long' });

//       // Calculate historical pattern for this hour
//       const hourPattern = hourlyPatterns[predictedHour];
//       const hourAvg = hourPattern.length
//         ? hourPattern.reduce((a, b) => a + b, 0) / hourPattern.length
//         : overallAvg;

//       // Calculate day of week pattern
//       const dowPattern = dayOfWeekPatterns[predictedDayOfWeek] || [];
//       const dowAvg = dowPattern.length
//         ? dowPattern.reduce((a, b) => a + b, 0) / dowPattern.length
//         : overallAvg;

//       // Calculate time of day factor (peak hours: 8am-12pm, 4pm-8pm)
//       let timeOfDayFactor = 1.0;
//       if ((predictedHour >= 8 && predictedHour <= 12) || (predictedHour >= 16 && predictedHour <= 20)) {
//         timeOfDayFactor = 1.3;
//       } else if (predictedHour >= 0 && predictedHour <= 6) {
//         timeOfDayFactor = 0.7;
//       }

//       // Calculate seasonality (simplified - would need more sophisticated model)
//       const monthFactor = 1.0; // Placeholder for seasonal variations

//       // Combine factors to predict visit count
//       const historicalFactor = hourAvg / overallAvg;
//       const dayOfWeekFactor = dowAvg / overallAvg;

//       const predictedVisits = overallAvg * historicalFactor * dayOfWeekFactor * timeOfDayFactor * trendFactor * monthFactor;

//       // Calculate likelihood of surge (visits significantly above average)
//       const zScore = (predictedVisits - overallAvg) / overallStdDev;
//       const likelihood = Math.min(100, Math.max(0, (zScore + 2) * 25)); // Normalize to 0-100

//       // Determine severity
//       let severity: 'Low' | 'Medium' | 'High' | 'Critical';
//       if (likelihood < 30) {
//         severity = 'Low';
//       } else if (likelihood < 60) {
//         severity = 'Medium';
//       } else if (likelihood < 85) {
//         severity = 'High';
//       } else {
//         severity = 'Critical';
//       }

//       // Calculate confidence based on data availability
//       const dataPoints = hourPattern.length;
//       const confidence = Math.min(1.0, dataPoints / 30); // Max confidence with 30+ data points

//       // Generate recommendations
//       const recommendations = this.generateRecommendations(severity, predictedHour, predictedVisits);

//       predictions.push({
//         hospitalId,
//         predictedDate: new Date(predictedTime.getFullYear(), predictedTime.getMonth(), predictedTime.getDate()),
//         predictedHour,
//         likelihood: Math.round(likelihood),
//         severity,
//         confidence: Math.round(confidence * 100) / 100,
//         factors: {
//           historicalPattern: Math.round(historicalFactor * 100) / 100,
//           dayOfWeek: Math.round(dayOfWeekFactor * 100) / 100,
//           timeOfDay: Math.round(timeOfDayFactor * 100) / 100,
//           seasonality: Math.round(monthFactor * 100) / 100,
//           recentTrend: Math.round(trendFactor * 100) / 100,
//         },
//         recommendations,
//       });
//     }

//     return predictions;
//   }

//   // Generate actionable recommendations
//   private generateRecommendations(
//     severity: string,
//     hour: number,
//     predictedVisits: number
//   ): string[] {
//     const recommendations: string[] = [];

//     if (severity === 'Critical' || severity === 'High') {
//       recommendations.push('Alert all available staff members');
//       recommendations.push('Prepare additional bedspaces in emergency department');
//       recommendations.push('Consider activating surge protocol');
//       recommendations.push('Ensure adequate medical supplies are stocked');
//       recommendations.push('Contact on-call physicians and specialists');
//     }

//     if (severity === 'High' || severity === 'Medium') {
//       recommendations.push('Schedule additional staff for this time period');
//       recommendations.push('Review and optimize patient flow processes');
//       recommendations.push('Ensure triage protocols are ready');
//     }

//     if (hour >= 0 && hour <= 6) {
//       recommendations.push('Coordinate with night shift staff');
//       recommendations.push('Ensure 24-hour services are adequately staffed');
//     } else if (hour >= 8 && hour <= 12) {
//       recommendations.push('Peak morning hours - optimize morning shift staffing');
//     } else if (hour >= 16 && hour <= 20) {
//       recommendations.push('Evening rush expected - prepare for increased traffic');
//     }

//     if (predictedVisits > 50) {
//       recommendations.push('Consider opening additional registration desks');
//       recommendations.push('Implement fast-track system for minor cases');
//     }

//     return recommendations;
//   }

//   // Get surge pattern analysis
//   async getSurgePatternAnalysis(hospitalId: string, days: number = 30): Promise<any> {
//     const now = new Date();
//     const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

//     const data = await this.surgeDataModel
//       .find({
//         hospital: new Types.ObjectId(hospitalId),
//         date: { $gte: startDate },
//       })
//       .sort({ date: 1, hour: 1 })
//       .exec();

//     // Analyze patterns
//     const hourlyAvg: Record<number, number[]> = {};
//     const dailyAvg: Record<string, number[]> = {};

//     for (let i = 0; i < 24; i++) {
//       hourlyAvg[i] = [];
//     }

//     data.forEach(record => {
//       hourlyAvg[record.hour].push(record.totalVisits);

//       if (!dailyAvg[record.dayOfWeek]) {
//         dailyAvg[record.dayOfWeek] = [];
//       }
//       dailyAvg[record.dayOfWeek].push(record.totalVisits);
//     });

//     const hourlyPatterns = Object.entries(hourlyAvg).map(([hour, visits]) => ({
//       hour: parseInt(hour),
//       averageVisits: visits.length ? visits.reduce((a, b) => a + b, 0) / visits.length : 0,
//       maxVisits: visits.length ? Math.max(...visits) : 0,
//       minVisits: visits.length ? Math.min(...visits) : 0,
//     }));

//     const dailyPatterns = Object.entries(dailyAvg).map(([day, visits]) => ({
//       dayOfWeek: day,
//       averageVisits: visits.length ? visits.reduce((a, b) => a + b, 0) / visits.length : 0,
//       maxVisits: visits.length ? Math.max(...visits) : 0,
//       minVisits: visits.length ? Math.min(...visits) : 0,
//     }));

//     // Identify peak hours
//     const peakHours = hourlyPatterns
//       .sort((a, b) => b.averageVisits - a.averageVisits)
//       .slice(0, 5);

//     return {
//       period: `${days} days`,
//       totalDataPoints: data.length,
//       hourlyPatterns,
//       dailyPatterns,
//       peakHours,
//       insights: {
//         busiestHour: peakHours[0]?.hour,
//         quietestHour: hourlyPatterns.sort((a, b) => a.averageVisits - b.averageVisits)[0]?.hour,
//         busiestDay: dailyPatterns.sort((a, b) => b.averageVisits - a.averageVisits)[0]?.dayOfWeek,
//       },
//     };
//   }
// }


import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SurgeData, SurgeDataDocument } from '../emr/schemas/emr.schema';
import { MedicalVisit, MedicalVisitDocument } from '../emr/schemas/emr.schema';

// Export the interface so it can be used in the controller
export interface SurgePrediction {
  hospitalId: string;
  predictedDate: Date;
  predictedHour: number;
  likelihood: number; // 0-100
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number; // 0-1
  factors: {
    historicalPattern: number;
    dayOfWeek: number;
    timeOfDay: number;
    seasonality: number;
    recentTrend: number;
  };
  recommendations: string[];
}

@Injectable()
export class SurgePredictionService {
  constructor(
    @InjectModel(SurgeData.name) private surgeDataModel: Model<SurgeDataDocument>,
    @InjectModel(MedicalVisit.name) private medicalVisitModel: Model<MedicalVisitDocument>,
  ) {}

  // Calculate moving average
  private calculateMovingAverage(data: number[], window: number): number {
    if (data.length < window) return data.reduce((a, b) => a + b, 0) / data.length;
    const recent = data.slice(-window);
    return recent.reduce((a, b) => a + b, 0) / window;
  }

  // Calculate standard deviation
  private calculateStdDev(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squareDiffs = data.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / data.length;
    return Math.sqrt(avgSquareDiff);
  }

  // Predict surge for next 24 hours
  async predictSurge(hospitalId: string): Promise<SurgePrediction[]> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get historical data
    const historicalData = await this.surgeDataModel
      .find({
        hospital: new Types.ObjectId(hospitalId),
        date: { $gte: thirtyDaysAgo },
      })
      .sort({ date: 1, hour: 1 })
      .exec();

    if (historicalData.length < 24) {
      // Not enough data for meaningful predictions
      return [];
    }

    // Organize data by hour of day
    const hourlyPatterns: Record<number, number[]> = {};
    const dayOfWeekPatterns: Record<string, number[]> = {};

    for (let i = 0; i < 24; i++) {
      hourlyPatterns[i] = [];
    }

    historicalData.forEach(record => {
      const hour = record.hour;
      const dayOfWeek = record.dayOfWeek;

      hourlyPatterns[hour].push(record.totalVisits);

      if (!dayOfWeekPatterns[dayOfWeek]) {
        dayOfWeekPatterns[dayOfWeek] = [];
      }
      dayOfWeekPatterns[dayOfWeek].push(record.totalVisits);
    });

    // Calculate overall average and standard deviation
    const allVisits = historicalData.map(r => r.totalVisits);
    const overallAvg = allVisits.reduce((a, b) => a + b, 0) / allVisits.length;
    const overallStdDev = this.calculateStdDev(allVisits);

    // Calculate recent trend (last 7 days vs previous 7 days)
    const recentSevenDays = historicalData.slice(-7 * 24);
    const previousSevenDays = historicalData.slice(-14 * 24, -7 * 24);

    const recentAvg = recentSevenDays.length
      ? recentSevenDays.reduce((sum, r) => sum + r.totalVisits, 0) / recentSevenDays.length
      : overallAvg;

    const previousAvg = previousSevenDays.length
      ? previousSevenDays.reduce((sum, r) => sum + r.totalVisits, 0) / previousSevenDays.length
      : overallAvg;

    const trendFactor = recentAvg / previousAvg;

    // Generate predictions for next 24 hours
    const predictions: SurgePrediction[] = [];
    const currentDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    for (let hourOffset = 1; hourOffset <= 24; hourOffset++) {
      const predictedTime = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
      const predictedHour = predictedTime.getHours();
      const predictedDayOfWeek = predictedTime.toLocaleDateString('en-US', { weekday: 'long' });

      // Calculate historical pattern for this hour
      const hourPattern = hourlyPatterns[predictedHour];
      const hourAvg = hourPattern.length
        ? hourPattern.reduce((a, b) => a + b, 0) / hourPattern.length
        : overallAvg;

      // Calculate day of week pattern
      const dowPattern = dayOfWeekPatterns[predictedDayOfWeek] || [];
      const dowAvg = dowPattern.length
        ? dowPattern.reduce((a, b) => a + b, 0) / dowPattern.length
        : overallAvg;

      // Calculate time of day factor (peak hours: 8am-12pm, 4pm-8pm)
      let timeOfDayFactor = 1.0;
      if ((predictedHour >= 8 && predictedHour <= 12) || (predictedHour >= 16 && predictedHour <= 20)) {
        timeOfDayFactor = 1.3;
      } else if (predictedHour >= 0 && predictedHour <= 6) {
        timeOfDayFactor = 0.7;
      }

      // Calculate seasonality (simplified - would need more sophisticated model)
      const monthFactor = 1.0; // Placeholder for seasonal variations

      // Combine factors to predict visit count
      const historicalFactor = hourAvg / overallAvg;
      const dayOfWeekFactor = dowAvg / overallAvg;

      const predictedVisits = overallAvg * historicalFactor * dayOfWeekFactor * timeOfDayFactor * trendFactor * monthFactor;

      // Calculate likelihood of surge (visits significantly above average)
      const zScore = (predictedVisits - overallAvg) / overallStdDev;
      const likelihood = Math.min(100, Math.max(0, (zScore + 2) * 25)); // Normalize to 0-100

      // Determine severity
      let severity: 'Low' | 'Medium' | 'High' | 'Critical';
      if (likelihood < 30) {
        severity = 'Low';
      } else if (likelihood < 60) {
        severity = 'Medium';
      } else if (likelihood < 85) {
        severity = 'High';
      } else {
        severity = 'Critical';
      }

      // Calculate confidence based on data availability
      const dataPoints = hourPattern.length;
      const confidence = Math.min(1.0, dataPoints / 30); // Max confidence with 30+ data points

      // Generate recommendations
      const recommendations = this.generateRecommendations(severity, predictedHour, predictedVisits);

      predictions.push({
        hospitalId,
        predictedDate: new Date(predictedTime.getFullYear(), predictedTime.getMonth(), predictedTime.getDate()),
        predictedHour,
        likelihood: Math.round(likelihood),
        severity,
        confidence: Math.round(confidence * 100) / 100,
        factors: {
          historicalPattern: Math.round(historicalFactor * 100) / 100,
          dayOfWeek: Math.round(dayOfWeekFactor * 100) / 100,
          timeOfDay: Math.round(timeOfDayFactor * 100) / 100,
          seasonality: Math.round(monthFactor * 100) / 100,
          recentTrend: Math.round(trendFactor * 100) / 100,
        },
        recommendations,
      });
    }

    return predictions;
  }

  // Generate actionable recommendations
  private generateRecommendations(
    severity: string,
    hour: number,
    predictedVisits: number
  ): string[] {
    const recommendations: string[] = [];

    if (severity === 'Critical' || severity === 'High') {
      recommendations.push('Alert all available staff members');
      recommendations.push('Prepare additional bedspaces in emergency department');
      recommendations.push('Consider activating surge protocol');
      recommendations.push('Ensure adequate medical supplies are stocked');
      recommendations.push('Contact on-call physicians and specialists');
    }

    if (severity === 'High' || severity === 'Medium') {
      recommendations.push('Schedule additional staff for this time period');
      recommendations.push('Review and optimize patient flow processes');
      recommendations.push('Ensure triage protocols are ready');
    }

    if (hour >= 0 && hour <= 6) {
      recommendations.push('Coordinate with night shift staff');
      recommendations.push('Ensure 24-hour services are adequately staffed');
    } else if (hour >= 8 && hour <= 12) {
      recommendations.push('Peak morning hours - optimize morning shift staffing');
    } else if (hour >= 16 && hour <= 20) {
      recommendations.push('Evening rush expected - prepare for increased traffic');
    }

    if (predictedVisits > 50) {
      recommendations.push('Consider opening additional registration desks');
      recommendations.push('Implement fast-track system for minor cases');
    }

    return recommendations;
  }

  // Get surge pattern analysis
  async getSurgePatternAnalysis(hospitalId: string, days: number = 30): Promise<any> {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const data = await this.surgeDataModel
      .find({
        hospital: new Types.ObjectId(hospitalId),
        date: { $gte: startDate },
      })
      .sort({ date: 1, hour: 1 })
      .exec();

    // Analyze patterns
    const hourlyAvg: Record<number, number[]> = {};
    const dailyAvg: Record<string, number[]> = {};

    for (let i = 0; i < 24; i++) {
      hourlyAvg[i] = [];
    }

    data.forEach(record => {
      hourlyAvg[record.hour].push(record.totalVisits);

      if (!dailyAvg[record.dayOfWeek]) {
        dailyAvg[record.dayOfWeek] = [];
      }
      dailyAvg[record.dayOfWeek].push(record.totalVisits);
    });

    const hourlyPatterns = Object.entries(hourlyAvg).map(([hour, visits]) => ({
      hour: parseInt(hour),
      averageVisits: visits.length ? visits.reduce((a, b) => a + b, 0) / visits.length : 0,
      maxVisits: visits.length ? Math.max(...visits) : 0,
      minVisits: visits.length ? Math.min(...visits) : 0,
    }));

    const dailyPatterns = Object.entries(dailyAvg).map(([day, visits]) => ({
      dayOfWeek: day,
      averageVisits: visits.length ? visits.reduce((a, b) => a + b, 0) / visits.length : 0,
      maxVisits: visits.length ? Math.max(...visits) : 0,
      minVisits: visits.length ? Math.min(...visits) : 0,
    }));

    // Identify peak hours
    const peakHours = hourlyPatterns
      .sort((a, b) => b.averageVisits - a.averageVisits)
      .slice(0, 5);

    return {
      period: `${days} days`,
      totalDataPoints: data.length,
      hourlyPatterns,
      dailyPatterns,
      peakHours,
      insights: {
        busiestHour: peakHours[0]?.hour,
        quietestHour: hourlyPatterns.sort((a, b) => a.averageVisits - b.averageVisits)[0]?.hour,
        busiestDay: dailyPatterns.sort((a, b) => b.averageVisits - a.averageVisits)[0]?.dayOfWeek,
      },
    };
  }
}