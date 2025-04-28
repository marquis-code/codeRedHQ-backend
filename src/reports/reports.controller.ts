import { Controller, Get, Param, Query, ParseDatePipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('bed-occupancy/:hospitalId')
  @ApiOperation({ summary: 'Get bed occupancy trends for a hospital' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns bed occupancy trends' })
  async getBedOccupancyTrends(
    @Param('hospitalId') hospitalId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    try {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD');
      }
      
      return this.reportsService.getBedOccupancyTrends(hospitalId, startDate, endDate);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD');
    }
  }

  @Get('emergency-alerts/:hospitalId')
  @ApiOperation({ summary: 'Get emergency alerts trends for a hospital' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns emergency alerts trends' })
  async getEmergencyAlertsTrends(
    @Param('hospitalId') hospitalId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    try {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD');
      }
      
      return this.reportsService.getEmergencyAlertsTrends(hospitalId, startDate, endDate);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD');
    }
  }

  @Get('staff-availability/:hospitalId')
  @ApiOperation({ summary: 'Get staff availability trends for a hospital' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns staff availability trends' })
  async getStaffAvailabilityTrends(
    @Param('hospitalId') hospitalId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    try {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD');
      }
      
      return this.reportsService.getStaffAvailabilityTrends(hospitalId, startDate, endDate);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD');
    }
  }

  @Get('dashboard-summary/:hospitalId')
  @ApiOperation({ summary: 'Get dashboard summary for a hospital' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
  @ApiResponse({ status: 200, description: 'Returns dashboard summary' })
  async getDashboardSummary(@Param('hospitalId') hospitalId: string) {
    return this.reportsService.getDashboardSummary(hospitalId);
  }
}