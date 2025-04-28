import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.gaurd';
import { AuditService } from './audit.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(':hospitalId')
  @ApiOperation({ summary: 'Get audit logs for a hospital' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'module', required: false, description: 'Filter by module' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  findAll(@Param('hospitalId') hospitalId: string, @Query() query: any) {
    return this.auditService.findAll(hospitalId, query);
  }

  @Get(':hospitalId/summary')
  @ApiOperation({ summary: 'Get audit activity summary for a hospital' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to include in summary' })
  getActivitySummary(
    @Param('hospitalId') hospitalId: string,
    @Query('days') days: number,
  ) {
    return this.auditService.getActivitySummary(hospitalId, days);
  }

  @Get('detail/:id')
  @ApiOperation({ summary: 'Get audit log detail' })
  @ApiParam({ name: 'id', description: 'Audit log ID' })
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}