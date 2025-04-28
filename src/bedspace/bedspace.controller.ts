import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { BedspaceService } from './bedspace.service';
import { CreateBedspaceDto } from './dto/create-bedspace.dto';
import { UpdateBedspaceDto } from './dto/update-bedspace.dto';
import { BedspaceDocument } from './schemas/bedspace.schema';

@Controller('bedspaces')
export class BedspaceController {
  constructor(private readonly bedspaceService: BedspaceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBedspaceDto: CreateBedspaceDto): Promise<BedspaceDocument> {
    return this.bedspaceService.create(createBedspaceDto);
  }

  @Get()
  async findAll(@Query('hospitalId') hospitalId?: string): Promise<BedspaceDocument[]> {
    return this.bedspaceService.findAllBedspaces(hospitalId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BedspaceDocument> {
    return this.bedspaceService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBedspaceDto: UpdateBedspaceDto,
  ): Promise<BedspaceDocument> {
    return this.bedspaceService.update(id, updateBedspaceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.bedspaceService.remove(id);
  }

  @Get('hospital/:hospitalId/summary')
  async getHospitalSummary(@Param('hospitalId') hospitalId: string): Promise<any> {
    return this.bedspaceService.getHospitalSummary(hospitalId);
  }

  @Put(':id/availability')
  async updateBedAvailability(
    @Param('id') id: string,
    @Query('action') action: string,
  ): Promise<BedspaceDocument> {
    const isDischarge = action === 'discharge';
    return this.bedspaceService.updateBedAvailability(id, isDischarge);
  }
}