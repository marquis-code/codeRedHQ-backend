import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  Query, 
  HttpStatus, 
  HttpCode, 
  UseGuards, 
  Request,
  HttpException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { StaffingService } from './staff.service';
import { 
  RegisterStaffDto, 
  LoginStaffDto, 
  ClockInDto, 
  ClockOutDto, 
  CreateStaffDto, 
  UpdateStaffDto 
} from './dto/create-staff.dto';
import { BootstrapAdminDto } from "./dto/bootstrap-admin.dto"
import { JwtAuthGuard } from '../auth/jwt-auth.gaurd';
import { PermissionGuard, Permissions } from '../auth/permission.guard';

@ApiTags('Staff Management')
@Controller('staff')
export class StaffingController {
  constructor(private readonly staffingService: StaffingService) {}

  // ==================== PUBLIC ROUTES ====================

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new staff member' })
  @ApiResponse({ 
    status: 201, 
    description: 'Staff registered successfully. Awaiting admin verification.' 
  })
  @ApiResponse({ status: 400, description: 'Invalid input or email already exists' })
  async register(@Body() registerDto: RegisterStaffDto) {
    try {
      const result = await this.staffingService.register(registerDto);
      return {
        success: true,
        message: 'Registration successful. Your account is pending verification by hospital admin.',
        data: {
          staff: {
            id: result.staff._id,
            name: result.staff.name,
            email: result.staff.email,
            position: result.staff.position,
            department: result.staff.department,
            hospital: result.staff.hospital,
            isVerified: result.staff.isVerified,
            isActive: result.staff.isActive,
          },
          token: result.token,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }


  @Post('bootstrap-admin')
@HttpCode(HttpStatus.CREATED)
@ApiOperation({ summary: 'Bootstrap first hospital admin (one-time per hospital)' })
@ApiResponse({ status: 201, description: 'Admin created successfully' })
@ApiResponse({ status: 403, description: 'Forbidden / invalid secret' })
@ApiResponse({ status: 409, description: 'Admin already exists for hospital' })
async bootstrapAdmin(
  @Body() dto: BootstrapAdminDto,
  @Request() req: any
) {
  try {
    // secret can come from header OR body; header is cleaner
    const secret = req.headers['x-bootstrap-secret'] as string;

    const result = await this.staffingService.bootstrapAdmin(dto, secret);

    return {
      success: true,
      message: 'Bootstrap admin created successfully',
      data: {
        staff: {
          id: result.staff._id,
          name: result.staff.name,
          email: result.staff.email,
          hospital: result.staff.hospital,
          permissions: result.staff.permissions,
          emrAccessLevel: result.staff.emrAccessLevel,
          isVerified: result.staff.isVerified,
          isActive: result.staff.isActive,
        },
        token: result.token,
      },
    };
  } catch (error) {
    throw new HttpException(
      { success: false, message: error.message },
      error.status || HttpStatus.BAD_REQUEST
    );
  }
}


  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Staff login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account not verified' })
  async login(@Body() loginDto: LoginStaffDto) {
    try {
      const result = await this.staffingService.login(loginDto);
      return {
        success: true,
        message: 'Login successful',
        data: {
          staff: {
            id: result.staff._id,
            name: result.staff.name,
            email: result.staff.email,
            position: result.staff.position,
            department: result.staff.department,
            hospital: result.staff.hospital,
            permissions: result.staff.permissions,
            emrAccessLevel: result.staff.emrAccessLevel,
            availability: result.staff.availability,
            isVerified: result.staff.isVerified,
            isActive: result.staff.isActive,
          },
          token: result.token,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }

  // ==================== PROTECTED ROUTES (Authenticated Staff) ====================

  @Post('clock-in')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clock in for shift (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Clocked in successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Already clocked in or too far from hospital' })
  async clockIn(
    @Body() clockInDto: ClockInDto,
    @Request() req: any,
  ) {
    try {
      const staffId = req.user.sub; // Get staff ID from JWT token
      const staff = await this.staffingService.clockIn(staffId, clockInDto);
      
      return {
        success: true,
        message: 'Clocked in successfully',
        data: {
          staffId: staff._id,
          name: staff.name,
          clockInTime: staff.currentShift?.clockInTime,
          shift: staff.currentShift?.shift,
          availability: staff.availability,
          distanceFromHospital: staff.currentShift?.distanceFromHospital,
          location: staff.lastKnownLocation,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('clock-out')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clock out from shift (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Clocked out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Not currently clocked in' })
  async clockOut(
    @Body() clockOutDto: ClockOutDto,
    @Request() req: any,
  ) {
    try {
      const staffId = req.user.sub;
      const staff = await this.staffingService.clockOut(staffId, clockOutDto);
      
      const lastShift = staff.attendanceHistory[staff.attendanceHistory.length - 1];
      const duration = lastShift.clockOutTime && lastShift.clockInTime
        ? (new Date(lastShift.clockOutTime).getTime() - new Date(lastShift.clockInTime).getTime()) / (1000 * 60 * 60)
        : null;
      
      return {
        success: true,
        message: 'Clocked out successfully',
        data: {
          staffId: staff._id,
          name: staff.name,
          availability: staff.availability,
          lastShift: {
            ...lastShift,
            durationHours: duration ? Math.round(duration * 100) / 100 : null,
          },
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('attendance/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get attendance history (requires authentication)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-12-31' })
  @ApiResponse({ status: 200, description: 'Attendance history retrieved successfully' })
  async getAttendanceHistory(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const staffId = req.user.sub;
      const history = await this.staffingService.getAttendanceHistory(
        staffId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
      
      return {
        success: true,
        message: 'Attendance history retrieved successfully',
        data: history,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current staff profile (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req: any) {
    try {
      const staffId = req.user.sub;
      const staff = await this.staffingService.findOne(staffId);
      
      // Don't send password in response
      const { password, ...staffData } = staff.toObject();
      
      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: staffData,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ==================== ADMIN ROUTES ====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('admin', 'manage_staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create staff member (Admin only)' })
  @ApiResponse({ status: 201, description: 'Staff created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() createStaffDto: CreateStaffDto) {
    try {
      const staff = await this.staffingService.create(createStaffDto);
      return {
        success: true,
        message: 'Staff created successfully',
        data: staff,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/verify')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('admin', 'manage_staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify staff account (Admin only)' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Staff verified successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async verifyStaff(
    @Param('id') id: string,
    @Body() body: { permissions?: string[]; emrAccessLevel?: string },
  ) {
    try {
      const staff = await this.staffingService.verifyStaff(
        id,
        body.permissions || [],
        body.emrAccessLevel || 'none',
      );
      
      return {
        success: true,
        message: 'Staff verified successfully',
        data: staff,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all staff members (requires authentication)' })
  @ApiQuery({ name: 'hospitalId', required: false, type: String })
  @ApiQuery({ name: 'department', required: false, type: String })
  @ApiQuery({ name: 'availability', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Staff list retrieved successfully' })
  async findAll(
    @Query('hospitalId') hospitalId?: string,
    @Query('department') department?: string,
    @Query('availability') availability?: string,
  ) {
    try {
      const staff = await this.staffingService.findAll(hospitalId, department, availability);
      return {
        success: true,
        message: 'Staff list retrieved successfully',
        data: staff,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('hospital/:hospitalId/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get staff summary for hospital (requires authentication)' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
  @ApiResponse({ status: 200, description: 'Staff summary retrieved successfully' })
  async getStaffSummary(@Param('hospitalId') hospitalId: string) {
    try {
      const summary = await this.staffingService.getStaffSummary(hospitalId);
      return {
        success: true,
        message: 'Staff summary retrieved successfully',
        data: summary,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get staff by ID (requires authentication)' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Staff retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  async findOne(@Param('id') id: string) {
    try {
      const staff = await this.staffingService.findOne(id);
      const { password, ...staffData } = staff.toObject();
      
      return {
        success: true,
        message: 'Staff retrieved successfully',
        data: staffData,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.NOT_FOUND
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update staff (requires authentication)' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Staff updated successfully' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  async update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    try {
      const staff = await this.staffingService.update(id, updateStaffDto);
      return {
        success: true,
        message: 'Staff updated successfully',
        data: staff,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('admin', 'manage_staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete/Deactivate staff (Admin only)' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Staff deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async remove(@Param('id') id: string) {
    try {
      await this.staffingService.remove(id);
      return {
        success: true,
        message: 'Staff deactivated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update staff availability (requires authentication)' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Availability updated successfully' })
  async updateAvailability(
    @Param('id') id: string,
    @Body('availability') availability: string,
  ) {
    try {
      const staff = await this.staffingService.updateAvailability(id, availability);
      return {
        success: true,
        message: 'Availability updated successfully',
        data: {
          staffId: staff._id,
          name: staff.name,
          availability: staff.availability,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}