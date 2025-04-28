import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { Hospital } from './schemas/hospital.schema';

@Controller('hospitals')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Post()
  async create(@Body() createHospitalDto: CreateHospitalDto): Promise<Hospital> {
    return this.hospitalService.create(createHospitalDto);
  }

  @Get()
  async findAll(@Query() query: any): Promise<Hospital[]> {
    return this.hospitalService.findAll(query);
  }

  @Get('nearby')
  async findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('maxDistance') maxDistance?: number,
  ): Promise<Hospital[]> {
    return this.hospitalService.findNearby(
      parseFloat(latitude as any), 
      parseFloat(longitude as any), 
      maxDistance ? parseFloat(maxDistance as any) : undefined
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Hospital> {
    return this.hospitalService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateHospitalDto: UpdateHospitalDto,
  ): Promise<Hospital> {
    return this.hospitalService.update(id, updateHospitalDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.hospitalService.remove(id);
  }
}