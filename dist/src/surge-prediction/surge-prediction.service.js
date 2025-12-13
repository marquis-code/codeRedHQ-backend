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
exports.SurgePredictionService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const emr_schema_1 = require("../emr/schemas/emr.schema");
const emr_schema_2 = require("../emr/schemas/emr.schema");
let SurgePredictionService = class SurgePredictionService {
    constructor(surgeDataModel, medicalVisitModel) {
        this.surgeDataModel = surgeDataModel;
        this.medicalVisitModel = medicalVisitModel;
    }
    calculateMovingAverage(data, window) {
        if (data.length < window)
            return data.reduce((a, b) => a + b, 0) / data.length;
        const recent = data.slice(-window);
        return recent.reduce((a, b) => a + b, 0) / window;
    }
    calculateStdDev(data) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const squareDiffs = data.map(value => Math.pow(value - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / data.length;
        return Math.sqrt(avgSquareDiff);
    }
    async predictSurge(hospitalId) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const historicalData = await this.surgeDataModel
            .find({
            hospital: new mongoose_2.Types.ObjectId(hospitalId),
            date: { $gte: thirtyDaysAgo },
        })
            .sort({ date: 1, hour: 1 })
            .exec();
        if (historicalData.length < 24) {
            return [];
        }
        const hourlyPatterns = {};
        const dayOfWeekPatterns = {};
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
        const allVisits = historicalData.map(r => r.totalVisits);
        const overallAvg = allVisits.reduce((a, b) => a + b, 0) / allVisits.length;
        const overallStdDev = this.calculateStdDev(allVisits);
        const recentSevenDays = historicalData.slice(-7 * 24);
        const previousSevenDays = historicalData.slice(-14 * 24, -7 * 24);
        const recentAvg = recentSevenDays.length
            ? recentSevenDays.reduce((sum, r) => sum + r.totalVisits, 0) / recentSevenDays.length
            : overallAvg;
        const previousAvg = previousSevenDays.length
            ? previousSevenDays.reduce((sum, r) => sum + r.totalVisits, 0) / previousSevenDays.length
            : overallAvg;
        const trendFactor = recentAvg / previousAvg;
        const predictions = [];
        const currentDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
        for (let hourOffset = 1; hourOffset <= 24; hourOffset++) {
            const predictedTime = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
            const predictedHour = predictedTime.getHours();
            const predictedDayOfWeek = predictedTime.toLocaleDateString('en-US', { weekday: 'long' });
            const hourPattern = hourlyPatterns[predictedHour];
            const hourAvg = hourPattern.length
                ? hourPattern.reduce((a, b) => a + b, 0) / hourPattern.length
                : overallAvg;
            const dowPattern = dayOfWeekPatterns[predictedDayOfWeek] || [];
            const dowAvg = dowPattern.length
                ? dowPattern.reduce((a, b) => a + b, 0) / dowPattern.length
                : overallAvg;
            let timeOfDayFactor = 1.0;
            if ((predictedHour >= 8 && predictedHour <= 12) || (predictedHour >= 16 && predictedHour <= 20)) {
                timeOfDayFactor = 1.3;
            }
            else if (predictedHour >= 0 && predictedHour <= 6) {
                timeOfDayFactor = 0.7;
            }
            const monthFactor = 1.0;
            const historicalFactor = hourAvg / overallAvg;
            const dayOfWeekFactor = dowAvg / overallAvg;
            const predictedVisits = overallAvg * historicalFactor * dayOfWeekFactor * timeOfDayFactor * trendFactor * monthFactor;
            const zScore = (predictedVisits - overallAvg) / overallStdDev;
            const likelihood = Math.min(100, Math.max(0, (zScore + 2) * 25));
            let severity;
            if (likelihood < 30) {
                severity = 'Low';
            }
            else if (likelihood < 60) {
                severity = 'Medium';
            }
            else if (likelihood < 85) {
                severity = 'High';
            }
            else {
                severity = 'Critical';
            }
            const dataPoints = hourPattern.length;
            const confidence = Math.min(1.0, dataPoints / 30);
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
    generateRecommendations(severity, hour, predictedVisits) {
        const recommendations = [];
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
        }
        else if (hour >= 8 && hour <= 12) {
            recommendations.push('Peak morning hours - optimize morning shift staffing');
        }
        else if (hour >= 16 && hour <= 20) {
            recommendations.push('Evening rush expected - prepare for increased traffic');
        }
        if (predictedVisits > 50) {
            recommendations.push('Consider opening additional registration desks');
            recommendations.push('Implement fast-track system for minor cases');
        }
        return recommendations;
    }
    async getSurgePatternAnalysis(hospitalId, days = 30) {
        var _a, _b, _c;
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const data = await this.surgeDataModel
            .find({
            hospital: new mongoose_2.Types.ObjectId(hospitalId),
            date: { $gte: startDate },
        })
            .sort({ date: 1, hour: 1 })
            .exec();
        const hourlyAvg = {};
        const dailyAvg = {};
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
                busiestHour: (_a = peakHours[0]) === null || _a === void 0 ? void 0 : _a.hour,
                quietestHour: (_b = hourlyPatterns.sort((a, b) => a.averageVisits - b.averageVisits)[0]) === null || _b === void 0 ? void 0 : _b.hour,
                busiestDay: (_c = dailyPatterns.sort((a, b) => b.averageVisits - a.averageVisits)[0]) === null || _c === void 0 ? void 0 : _c.dayOfWeek,
            },
        };
    }
};
SurgePredictionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(emr_schema_1.SurgeData.name)),
    __param(1, (0, mongoose_1.InjectModel)(emr_schema_2.MedicalVisit.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], SurgePredictionService);
exports.SurgePredictionService = SurgePredictionService;
//# sourceMappingURL=surge-prediction.service.js.map