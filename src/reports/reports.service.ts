import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';

import { Bedspace, BedspaceDocument } from '../bedspace/schemas/bedspace.schema';
import { EmergencyAlert, EmergencyAlertDocument } from '../emergency-alerts/schemas/emergency-alerts.schema';
import { Staff, StaffDocument } from '../staffing/schemas/staff.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Bedspace.name)
    private bedspaceModel: Model<BedspaceDocument>,
    @InjectModel(EmergencyAlert.name)
    private emergencyAlertModel: Model<EmergencyAlertDocument>,
    @InjectModel(Staff.name)
    private staffModel: Model<StaffDocument>,
  ) {}

  async getBedOccupancyTrends(hospitalId: string, startDate: Date, endDate: Date): Promise<any> {
    if (!isValidObjectId(hospitalId)) {
      throw new BadRequestException('Invalid hospital ID');
    }
    
    // Validate dates
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }
    
    // Get bedspace history for the date range
    const bedspaces = await this.bedspaceModel.find({
      hospital: new MongooseSchema.Types.ObjectId(hospitalId),
    }).exec();
    
    // Extract history entries within the date range
    const historyData = [];
    
    bedspaces.forEach(bedspace => {
      bedspace.history.forEach(entry => {
        if (entry.date >= startDate && entry.date <= endDate) {
          historyData.push({
            date: entry.date,
            department: bedspace.departmentName,
            available: entry.available,
            occupied: entry.occupied,
            total: entry.available + entry.occupied
          });
        }
      });
    });
    
    // Group by date
    const groupedByDate = historyData.reduce((acc, entry) => {
      const dateStr = entry.date.toISOString().split('T')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          totalBeds: 0,
          availableBeds: 0,
          occupiedBeds: 0,
          departments: {}
        };
      }
      
      // Update totals
      acc[dateStr].totalBeds += entry.total;
      acc[dateStr].availableBeds += entry.available;
      acc[dateStr].occupiedBeds += entry.occupied;
      
      // Update department data
      if (!acc[dateStr].departments[entry.department]) {
        acc[dateStr].departments[entry.department] = {
          totalBeds: 0,
          availableBeds: 0,
          occupiedBeds: 0
        };
      }
      
      acc[dateStr].departments[entry.department].totalBeds += entry.total;
      acc[dateStr].departments[entry.department].availableBeds += entry.available;
      acc[dateStr].departments[entry.department].occupiedBeds += entry.occupied;
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    return Object.values(groupedByDate).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  async getEmergencyAlertsTrends(hospitalId: string, startDate: Date, endDate: Date): Promise<any> {
    if (!isValidObjectId(hospitalId)) {
      throw new BadRequestException('Invalid hospital ID');
    }
    
    // Validate dates
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }
    
    // Get alerts for the date range
    const alerts = await this.emergencyAlertModel.find({
      hospital: new MongooseSchema.Types.ObjectId(hospitalId),
      createdAt: { $gte: startDate, $lte: endDate }
    }).exec();
    
    // Group by date and severity
    const groupedByDate = alerts.reduce((acc, alert) => {
      // Use the createdAt property safely with type assertion or optional chaining
      const alertDate = (alert as any).createdAt || new Date();
      const dateStr = alertDate.toISOString().split('T')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          total: 0,
          High: 0,
          Moderate: 0,
          Low: 0,
          byDepartment: {}
        };
      }
      
      // Update totals
      acc[dateStr].total++;
      acc[dateStr][alert.severity]++;
      
      // Update department data
      if (alert.affectedDepartment) {
        if (!acc[dateStr].byDepartment[alert.affectedDepartment]) {
          acc[dateStr].byDepartment[alert.affectedDepartment] = {
            total: 0,
            High: 0,
            Moderate: 0,
            Low: 0
          };
        }
        
        acc[dateStr].byDepartment[alert.affectedDepartment].total++;
        acc[dateStr].byDepartment[alert.affectedDepartment][alert.severity]++;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    return Object.values(groupedByDate).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  async getStaffAvailabilityTrends(hospitalId: string, startDate: Date, endDate: Date): Promise<any> {
    if (!isValidObjectId(hospitalId)) {
      throw new BadRequestException('Invalid hospital ID');
    }
    
    // Validate dates
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }
    
    // Get staff schedule for the date range
    const staff = await this.staffModel.find({
      hospital: new MongooseSchema.Types.ObjectId(hospitalId),
      isActive: true,
      'schedule.date': { $gte: startDate, $lte: endDate }
    }).exec();
    
    // Extract schedule entries within the date range
    const scheduleData = [];
    
    staff.forEach(staffMember => {
      staffMember.schedule.forEach(entry => {
        if (entry.date >= startDate && entry.date <= endDate) {
          scheduleData.push({
            date: entry.date,
            department: staffMember.department,
            position: staffMember.position,
            shift: entry.shift,
            status: entry.status
          });
        }
      });
    });
    
    // Group by date
    const groupedByDate = scheduleData.reduce((acc, entry) => {
      const dateStr = entry.date.toISOString().split('T')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          total: 0,
          available: 0,
          unavailable: 0,
          byDepartment: {},
          byPosition: {},
          byShift: {}
        };
      }
      
      // Update totals
      acc[dateStr].total++;
      
      if (entry.status === 'Available') {
        acc[dateStr].available++;
      } else {
        acc[dateStr].unavailable++;
      }
      
      // Update department data
      if (!acc[dateStr].byDepartment[entry.department]) {
        acc[dateStr].byDepartment[entry.department] = {
          total: 0,
          available: 0,
          unavailable: 0
        };
      }
      
      acc[dateStr].byDepartment[entry.department].total++;
      
      if (entry.status === 'Available') {
        acc[dateStr].byDepartment[entry.department].available++;
      } else {
        acc[dateStr].byDepartment[entry.department].unavailable++;
      }
      
      // Update position data
      if (!acc[dateStr].byPosition[entry.position]) {
        acc[dateStr].byPosition[entry.position] = {
          total: 0,
          available: 0,
          unavailable: 0
        };
      }
      
      acc[dateStr].byPosition[entry.position].total++;
      
      if (entry.status === 'Available') {
        acc[dateStr].byPosition[entry.position].available++;
      } else {
        acc[dateStr].byPosition[entry.position].unavailable++;
      }
      
      // Update shift data
      if (!acc[dateStr].byShift[entry.shift]) {
        acc[dateStr].byShift[entry.shift] = {
          total: 0,
          available: 0,
          unavailable: 0
        };
      }
      
      acc[dateStr].byShift[entry.shift].total++;
      
      if (entry.status === 'Available') {
        acc[dateStr].byShift[entry.shift].available++;
      } else {
        acc[dateStr].byShift[entry.shift].unavailable++;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    return Object.values(groupedByDate).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  async getDashboardSummary(hospitalId: string): Promise<any> {
    if (!isValidObjectId(hospitalId)) {
      throw new BadRequestException('Invalid hospital ID');
    }
    
    // Get current date and yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get last week
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    // Get bedspace summary
    const bedspaceSummary = await this.bedspaceModel.aggregate([
      { $match: { hospital: new MongooseSchema.Types.ObjectId(hospitalId) } },
      { $group: {
          _id: null,
          totalBeds: { $sum: '$totalBeds' },
          availableBeds: { $sum: '$availableBeds' },
          occupiedBeds: { $sum: '$occupiedBeds' }
        }
      }
    ]).exec();
    
    // Get yesterday's bedspace data
    const yesterdayBedspace = await this.bedspaceModel.aggregate([
      { $match: { hospital: new MongooseSchema.Types.ObjectId(hospitalId) } },
      { $unwind: '$history' },
      { $match: { 'history.date': { $gte: yesterday, $lt: today } } },
      { $group: {
          _id: null,
          totalBeds: { $sum: '$totalBeds' },
          availableBeds: { $sum: '$history.available' },
          occupiedBeds: { $sum: '$history.occupied' }
        }
      }
    ]).exec();
    
    // Get active alerts count
    const activeAlerts = await this.emergencyAlertModel.countDocuments({
      hospital: new MongooseSchema.Types.ObjectId(hospitalId),
      status: 'Active'
    }).exec();
    
    // Get last week's alerts count
    const lastWeekAlerts = await this.emergencyAlertModel.countDocuments({
      hospital: new MongooseSchema.Types.ObjectId(hospitalId),
      createdAt: { $gte: lastWeek, $lt: today }
    }).exec();
    
    // Get staff on ground
    const staffOnGround = await this.staffModel.countDocuments({
      hospital: new MongooseSchema.Types.ObjectId(hospitalId),
      isActive: true,
      availability: 'Available'
    }).exec();
    
    // Get yesterday's staff on ground
    const yesterdayStaff = await this.staffModel.aggregate([
      { $match: { 
          hospital: new MongooseSchema.Types.ObjectId(hospitalId),
          isActive: true
        } 
      },
      { $unwind: '$schedule' },
      { $match: { 'schedule.date': { $gte: yesterday, $lt: today } } },
      { $group: {
          _id: '$schedule.status',
          count: { $sum: 1 }
        }
      }
    ]).exec();
    
    const yesterdayStaffAvailable = yesterdayStaff.find(item => item._id === 'Available')?.count || 0;
    
    // Calculate percentage changes
    const bedspace = bedspaceSummary.length > 0 ? bedspaceSummary[0] : { totalBeds: 0, availableBeds: 0, occupiedBeds: 0 };
    const yesterdayBeds = yesterdayBedspace.length > 0 ? yesterdayBedspace[0] : { totalBeds: 0, availableBeds: 0, occupiedBeds: 0 };
    
    const availableBedChange = yesterdayBeds.availableBeds > 0 
      ? ((bedspace.availableBeds - yesterdayBeds.availableBeds) / yesterdayBeds.availableBeds) * 100 
      : 0;
    
    const occupiedBedChangeCalc = yesterdayBeds.occupiedBeds > 0 
      ? ((bedspace.occupiedBeds - yesterdayBeds.occupiedBeds) / yesterdayBeds.occupiedBeds) * 100 
      : 0;
    
    const staffChange = yesterdayStaffAvailable > 0 
      ? ((staffOnGround - yesterdayStaffAvailable) / yesterdayStaffAvailable) * 100 
      : 0;
    
    // Prepare dashboard summary
    return {
      bedspace: {
        availableBeds: bedspace.availableBeds,
        occupiedBeds: bedspace.occupiedBeds,
        totalBeds: bedspace.totalBeds,
        occupancyRate: bedspace.totalBeds > 0 ? (bedspace.occupiedBeds / bedspace.totalBeds) * 100 : 0,
        availableBedChange,
        occupiedBedChange: occupiedBedChangeCalc
      },
      alerts: {
        active: activeAlerts,
        weeklyChange: lastWeekAlerts > 0 ? ((activeAlerts - lastWeekAlerts) / lastWeekAlerts) * 100 : 0
      },
      staff: {
        onGround: staffOnGround,
        change: staffChange
      }
    };
  }
}