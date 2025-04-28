// staffing.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { StaffingService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffDocument } from './schemas/staff.schema';

@Controller('staff')
export class StaffingController {
  constructor(private readonly staffingService: StaffingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStaffDto: CreateStaffDto): Promise<StaffDocument> {
    return this.staffingService.create(createStaffDto);
  }

  @Get()
  async findAll(
    @Query('hospitalId') hospitalId?: string,
    @Query('department') department?: string,
    @Query('availability') availability?: string,
  ): Promise<StaffDocument[]> {
    return this.staffingService.findAll(hospitalId, department, availability);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<StaffDocument> {
    return this.staffingService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ): Promise<StaffDocument> {
    return this.staffingService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.staffingService.remove(id);
  }

  @Put(':id/availability')
  async updateAvailability(
    @Param('id') id: string,
    @Body('availability') availability: string,
  ): Promise<StaffDocument> {
    return this.staffingService.updateAvailability(id, availability);
  }

  @Get('hospital/:hospitalId/summary')
  async getStaffSummary(@Param('hospitalId') hospitalId: string): Promise<any> {
    return this.staffingService.getStaffSummary(hospitalId);
  }
}