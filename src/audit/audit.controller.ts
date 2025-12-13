// import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/jwt-auth.gaurd';
// import { AuditService } from './audit.service';
// import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

// @ApiTags('audit')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
// @Controller('audit')
// export class AuditController {
//   constructor(private readonly auditService: AuditService) {}

//   @Get(':hospitalId')
//   @ApiOperation({ summary: 'Get audit logs for a hospital' })
//   @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
//   @ApiQuery({ name: 'page', required: false, description: 'Page number' })
//   @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
//   @ApiQuery({ name: 'module', required: false, description: 'Filter by module' })
//   @ApiQuery({ name: 'action', required: false, description: 'Filter by action' })
//   @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
//   @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
//   findAll(@Param('hospitalId') hospitalId: string, @Query() query: any) {
//     return this.auditService.findAll(hospitalId, query);
//   }

//   @Get(':hospitalId/summary')
//   @ApiOperation({ summary: 'Get audit activity summary for a hospital' })
//   @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
//   @ApiQuery({ name: 'days', required: false, description: 'Number of days to include in summary' })
//   getActivitySummary(
//     @Param('hospitalId') hospitalId: string,
//     @Query('days') days: number,
//   ) {
//     return this.auditService.getActivitySummary(hospitalId, days);
//   }

//   @Get('detail/:id')
//   @ApiOperation({ summary: 'Get audit log detail' })
//   @ApiParam({ name: 'id', description: 'Audit log ID' })
//   findOne(@Param('id') id: string) {
//     return this.auditService.findOne(id);
//   }
// }


import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService, CreateAuditLogDto } from './audit.service';
import { Types } from 'mongoose';

// Optional: Add authentication guard if you have one
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Audit Logs')
@Controller('audit')
// @UseGuards(JwtAuthGuard) // Uncomment if you want to protect these endpoints
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create audit log',
    description: 'Manually create an audit log entry'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Audit log created successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createLog(@Body() createAuditLogDto: CreateAuditLogDto) {
    try {
      const log = await this.auditService.createLog(createAuditLogDto);
      
      return {
        success: true,
        message: 'Audit log created successfully',
        data: log
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create audit log',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('hospital/:hospitalId')
  @ApiOperation({ 
    summary: 'Get hospital audit logs',
    description: 'Retrieve audit logs for a specific hospital with optional filters'
  })
  @ApiParam({ 
    name: 'hospitalId', 
    description: 'Hospital ID',
    type: String
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    type: String,
    description: 'Start date (ISO format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    type: String,
    description: 'End date (ISO format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @ApiQuery({ 
    name: 'action', 
    required: false, 
    type: String,
    description: 'Filter by action type',
    example: 'bedspace_update'
  })
  @ApiQuery({ 
    name: 'resourceType', 
    required: false, 
    type: String,
    description: 'Filter by resource type',
    example: 'Bedspace'
  })
  @ApiQuery({ 
    name: 'staffId', 
    required: false, 
    type: String,
    description: 'Filter by staff ID'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of records to return',
    example: 50
  })
  @ApiQuery({ 
    name: 'skip', 
    required: false, 
    type: Number,
    description: 'Number of records to skip',
    example: 0
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Audit logs retrieved successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid hospital ID' })
  async getHospitalLogs(
    @Param('hospitalId') hospitalId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('staffId') staffId?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    // Validate hospital ID
    if (!Types.ObjectId.isValid(hospitalId)) {
      throw new BadRequestException('Invalid hospital ID format');
    }

    try {
      const options: any = {};

      if (startDate) {
        options.startDate = new Date(startDate);
        if (isNaN(options.startDate.getTime())) {
          throw new BadRequestException('Invalid start date format');
        }
      }

      if (endDate) {
        options.endDate = new Date(endDate);
        if (isNaN(options.endDate.getTime())) {
          throw new BadRequestException('Invalid end date format');
        }
      }

      if (action) options.action = action;
      if (resourceType) options.resourceType = resourceType;
      if (staffId) {
        if (!Types.ObjectId.isValid(staffId)) {
          throw new BadRequestException('Invalid staff ID format');
        }
        options.staffId = staffId;
      }
      if (limit) options.limit = parseInt(limit, 10);
      if (skip) options.skip = parseInt(skip, 10);

      const result = await this.auditService.getHospitalLogs(hospitalId, options);

      return {
        success: true,
        message: 'Audit logs retrieved successfully',
        data: {
          logs: result.logs,
          total: result.total,
          limit: options.limit || 50,
          skip: options.skip || 0,
          hasMore: result.total > (options.skip || 0) + result.logs.length
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve audit logs',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('resource/:resourceType/:resourceId')
  @ApiOperation({ 
    summary: 'Get resource history',
    description: 'Retrieve audit history for a specific resource'
  })
  @ApiParam({ 
    name: 'resourceType', 
    description: 'Type of resource (e.g., Bedspace, Patient, MedicalVisit)',
    type: String,
    example: 'Bedspace'
  })
  @ApiParam({ 
    name: 'resourceId', 
    description: 'Resource ID',
    type: String
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resource history retrieved successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid resource ID' })
  async getResourceHistory(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    // Validate resource ID
    if (!Types.ObjectId.isValid(resourceId)) {
      throw new BadRequestException('Invalid resource ID format');
    }

    try {
      const logs = await this.auditService.getResourceHistory(resourceType, resourceId);

      return {
        success: true,
        message: 'Resource history retrieved successfully',
        data: {
          resourceType,
          resourceId,
          totalRecords: logs.length,
          history: logs
        }
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve resource history',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('staff/:staffId/activity')
  @ApiOperation({ 
    summary: 'Get staff activity',
    description: 'Retrieve audit logs for a specific staff member'
  })
  @ApiParam({ 
    name: 'staffId', 
    description: 'Staff ID',
    type: String
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    type: String,
    description: 'Start date (ISO format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    type: String,
    description: 'End date (ISO format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Staff activity retrieved successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid staff ID' })
  async getStaffActivity(
    @Param('staffId') staffId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Validate staff ID
    if (!Types.ObjectId.isValid(staffId)) {
      throw new BadRequestException('Invalid staff ID format');
    }

    try {
      const startDateObj = startDate ? new Date(startDate) : undefined;
      const endDateObj = endDate ? new Date(endDate) : undefined;

      if (startDateObj && isNaN(startDateObj.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
      if (endDateObj && isNaN(endDateObj.getTime())) {
        throw new BadRequestException('Invalid end date format');
      }

      const logs = await this.auditService.getStaffActivity(
        staffId,
        startDateObj,
        endDateObj
      );

      return {
        success: true,
        message: 'Staff activity retrieved successfully',
        data: {
          staffId,
          totalActivities: logs.length,
          activities: logs
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve staff activity',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('hospital/:hospitalId/summary')
  @ApiOperation({ 
    summary: 'Get activity summary',
    description: 'Get aggregated activity summary for a hospital'
  })
  @ApiParam({ 
    name: 'hospitalId', 
    description: 'Hospital ID',
    type: String
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: true, 
    type: String,
    description: 'Start date (ISO format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: true, 
    type: String,
    description: 'End date (ISO format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Activity summary retrieved successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async getActivitySummary(
    @Param('hospitalId') hospitalId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // Validate hospital ID
    if (!Types.ObjectId.isValid(hospitalId)) {
      throw new BadRequestException('Invalid hospital ID format');
    }

    // Validate required date parameters
    if (!startDate || !endDate) {
      throw new BadRequestException('Both startDate and endDate are required');
    }

    try {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (isNaN(startDateObj.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
      if (isNaN(endDateObj.getTime())) {
        throw new BadRequestException('Invalid end date format');
      }

      if (startDateObj > endDateObj) {
        throw new BadRequestException('Start date must be before end date');
      }

      const summary = await this.auditService.getActivitySummary(
        hospitalId,
        startDateObj,
        endDateObj
      );

      return {
        success: true,
        message: 'Activity summary retrieved successfully',
        data: {
          hospitalId,
          period: {
            startDate: startDateObj,
            endDate: endDateObj
          },
          summary
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve activity summary',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}