import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { Staff, StaffDocument } from '../staffing/schemas/staff.schema';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { Hospital, HospitalDocument } from '../hospital/schemas/hospital.schema';
import { RegisterStaffDto, LoginStaffDto, ClockInDto, ClockOutDto, CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class StaffingService {
  // Maximum distance from hospital in meters (e.g., 500 meters)
  private readonly MAX_CLOCK_IN_DISTANCE = 500;

  constructor(
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    private eventEmitter: EventEmitter2,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }


  // Copy-paste these two methods into your staff.service.ts
// Replace your existing register and login methods with these:

// Register new staff
async register(registerStaffDto: RegisterStaffDto): Promise<{ staff: StaffDocument; token: string }> {
  // Check if hospital exists
  const hospital = await this.hospitalModel.findById(registerStaffDto.hospital);
  if (!hospital) {
    throw new NotFoundException('Hospital not found');
  }

  // Check if email already exists for this hospital
  const existingStaff = await this.staffModel.findOne({
    hospital: registerStaffDto.hospital,
    email: registerStaffDto.email,
  });

  if (existingStaff) {
    throw new BadRequestException('Staff with this email already exists in this hospital');
  }

  // Create new staff
  const staff = new this.staffModel({
    ...registerStaffDto,
    isVerified: false, // Requires admin approval
    availability: 'Off Shift',
  });

  const savedStaff = await staff.save();

  // Generate JWT token with proper payload structure
  const token = this.jwtService.sign({
    sub: savedStaff._id.toString(),
    email: savedStaff.email,
    hospitalId: savedStaff.hospital?.toString(),
    role: savedStaff.position,
    permissions: savedStaff.permissions || [],
    type: 'staff', // ✅ CRITICAL: Added type field
  });

  // Emit event
  this.eventEmitter.emit('staff.registered', {
    hospitalId: savedStaff.hospital,
    staff: savedStaff,
  });

  return { staff: savedStaff, token };
}

async createAdminForHospital(adminData: any): Promise<{ staff: StaffDocument; token: string }> {
  // Check if admin already exists for this hospital
  const existingAdmin = await this.staffModel.findOne({
    hospital: adminData.hospital,
    email: adminData.email,
  });

  if (existingAdmin) {
    throw new BadRequestException('Admin with this email already exists for this hospital');
  }

  // Create admin staff
  const staff = new this.staffModel({
    ...adminData,
    isVerified: true,
    isActive: true,
    permissions: ['admin', 'manage_staff', 'manage_bedspaces', 'manage_hospital', 'view_reports'],
    emrAccessLevel: 'admin',
  });

  const savedStaff = await staff.save();

  // Generate JWT token
  const token = this.jwtService.sign({
    sub: savedStaff._id.toString(),
    email: savedStaff.email,
    hospitalId: savedStaff.hospital?.toString(),
    role: savedStaff.position,
    permissions: savedStaff.permissions || [],
    type: 'staff',
  });

  // Emit event
  this.eventEmitter.emit('staff.admin_created', {
    hospitalId: savedStaff.hospital,
    staff: savedStaff,
  });

  return { staff: savedStaff, token };
}

// Login staff
async login(loginStaffDto: LoginStaffDto): Promise<{ staff: StaffDocument; token: string }> {
  // Find staff by email
  const staff = await this.staffModel.findOne({ email: loginStaffDto.email });

  if (!staff) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // Check password
  const isPasswordValid = await staff.comparePassword(loginStaffDto.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // Check if staff is active
  if (!staff.isActive) {
    throw new UnauthorizedException('Your account has been deactivated');
  }

  // Check if staff is verified
  if (!staff.isVerified) {
    throw new UnauthorizedException('Your account is pending verification by hospital admin');
  }

  // Generate JWT token with proper payload structure
  const token = this.jwtService.sign({
    sub: staff._id.toString(),
    email: staff.email,
    hospitalId: staff.hospital?.toString(),
    role: staff.position,
    permissions: staff.permissions || [],
    type: 'staff', // ✅ CRITICAL: Added type field
  });

  return { staff, token };
}


  // Clock In
  async clockIn(staffId: string, clockInDto: ClockInDto): Promise<StaffDocument> {
    const staff = await this.staffModel.findById(staffId);
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // Check if already clocked in
    if (staff.currentShift) {
      throw new BadRequestException('You are already clocked in. Please clock out first.');
    }

    // Get hospital coordinates
    const hospital = await this.hospitalModel.findById(staff.hospital);
    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    // Calculate distance from hospital
    const distance = this.calculateDistance(
      clockInDto.latitude,
      clockInDto.longitude,
      hospital.latitude,
      hospital.longitude
    );

    // Check if within acceptable range
    if (distance > this.MAX_CLOCK_IN_DISTANCE) {
      throw new ForbiddenException(
        `Clock in rejected: You are ${Math.round(distance)} meters away from the hospital. ` +
        `You must be within ${this.MAX_CLOCK_IN_DISTANCE} meters to clock in.`
      );
    }

    // Update staff with clock in data
    staff.currentShift = {
      clockInTime: new Date(),
      clockInLocation: {
        type: 'Point',
        coordinates: [clockInDto.longitude, clockInDto.latitude],
      },
      distanceFromHospital: distance,
      shift: clockInDto.shift,
    };

    staff.availability = 'On Shift';
    staff.lastKnownLocation = {
      type: 'Point',
      coordinates: [clockInDto.longitude, clockInDto.latitude],
    };
    staff.lastLocationUpdate = new Date();

    const updatedStaff = await staff.save();

    // Emit event
    this.eventEmitter.emit('staff.clocked_in', {
      hospitalId: staff.hospital,
      staffId: staff._id,
      clockInTime: staff.currentShift.clockInTime,
      distance,
      shift: clockInDto.shift,
    });

    return updatedStaff;
  }

  // Clock Out
  async clockOut(staffId: string, clockOutDto: ClockOutDto): Promise<StaffDocument> {
    const staff = await this.staffModel.findById(staffId);
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // Check if clocked in
    if (!staff.currentShift) {
      throw new BadRequestException('You are not clocked in');
    }

    // Get hospital coordinates
    const hospital = await this.hospitalModel.findById(staff.hospital);
    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    // Calculate distance from hospital
    const distance = this.calculateDistance(
      clockOutDto.latitude,
      clockOutDto.longitude,
      hospital.latitude,
      hospital.longitude
    );

    // Add to attendance history
    staff.attendanceHistory.push({
      clockInTime: staff.currentShift.clockInTime,
      clockOutTime: new Date(),
      clockInLocation: staff.currentShift.clockInLocation,
      clockOutLocation: {
        type: 'Point',
        coordinates: [clockOutDto.longitude, clockOutDto.latitude],
      },
      distanceFromHospital: staff.currentShift.distanceFromHospital,
      shift: staff.currentShift.shift,
      status: 'completed',
      notes: clockOutDto.notes,
    });

    // Clear current shift
    staff.currentShift = null;
    staff.availability = 'Off Shift';
    staff.lastKnownLocation = {
      type: 'Point',
      coordinates: [clockOutDto.longitude, clockOutDto.latitude],
    };
    staff.lastLocationUpdate = new Date();

    const updatedStaff = await staff.save();

    // Emit event
    this.eventEmitter.emit('staff.clocked_out', {
      hospitalId: staff.hospital,
      staffId: staff._id,
      clockOutTime: new Date(),
      distance,
    });

    return updatedStaff;
  }

  // Get attendance history
  async getAttendanceHistory(staffId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const staff = await this.staffModel.findById(staffId);
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    let history = staff.attendanceHistory;

    // Filter by date range if provided
    if (startDate || endDate) {
      history = history.filter(record => {
        const recordDate = new Date(record.clockInTime);
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
        return true;
      });
    }

    // Calculate statistics
    const totalShifts = history.length;
    const totalHours = history.reduce((sum, record) => {
      if (record.clockOutTime) {
        const hours = (new Date(record.clockOutTime).getTime() - new Date(record.clockInTime).getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    return {
      staff: {
        id: staff._id,
        name: staff.name,
        department: staff.department,
        position: staff.position,
      },
      statistics: {
        totalShifts,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHoursPerShift: totalShifts > 0 ? Math.round((totalHours / totalShifts) * 100) / 100 : 0,
      },
      history: history.map(record => ({
        clockInTime: record.clockInTime,
        clockOutTime: record.clockOutTime,
        shift: record.shift,
        duration: record.clockOutTime 
          ? Math.round(((new Date(record.clockOutTime).getTime() - new Date(record.clockInTime).getTime()) / (1000 * 60 * 60)) * 100) / 100
          : null,
        distanceFromHospital: record.distanceFromHospital,
        status: record.status,
        notes: record.notes,
      })),
    };
  }

  // Verify staff account (admin only)
  async verifyStaff(staffId: string, permissions: string[] = [], emrAccessLevel: string = 'none'): Promise<StaffDocument> {
    const staff = await this.staffModel.findById(staffId);
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    staff.isVerified = true;
    staff.permissions = permissions;
    staff.emrAccessLevel = emrAccessLevel;

    const updatedStaff = await staff.save();

    this.eventEmitter.emit('staff.verified', {
      hospitalId: staff.hospital,
      staffId: staff._id,
    });

    return updatedStaff;
  }

  // Check if staff has permission
  async checkPermission(staffId: string, permission: string): Promise<boolean> {
    const staff = await this.staffModel.findById(staffId);
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff.permissions.includes(permission);
  }

  // Original methods from your service
  async create(createStaffDto: CreateStaffDto): Promise<StaffDocument> {
    const createdStaff = new this.staffModel(createStaffDto);
    const savedStaff = await createdStaff.save();
    
    this.eventEmitter.emit('staff.created', {
      hospitalId: savedStaff.hospital,
      staff: savedStaff,
    });
    
    return savedStaff;
  }


async bootstrapAdmin(
  dto: BootstrapAdminDto,
  secretFromHeader: string,
): Promise<{ staff: StaffDocument; token: string }> {
  const expectedSecret = this.configService.get<string>('BOOTSTRAP_ADMIN_SECRET');

  if (!expectedSecret) {
    throw new ForbiddenException('Bootstrap secret is not configured on server');
  }

  if (!secretFromHeader || secretFromHeader !== expectedSecret) {
    throw new ForbiddenException('Invalid bootstrap secret');
  }

  // Ensure hospital exists
  const hospital = await this.hospitalModel.findById(dto.hospital);
  if (!hospital) throw new NotFoundException('Hospital not found');

  // Prevent multiple admins per hospital (bootstrap is one-time)
  const existingAdmin = await this.staffModel.findOne({
    hospital: dto.hospital,
    permissions: { $in: ['admin'] },
    isActive: true,
  });

  if (existingAdmin) {
    throw new BadRequestException('Admin already exists for this hospital');
  }

  // Ensure email uniqueness
  const existingEmail = await this.staffModel.findOne({ email: dto.email });
  if (existingEmail) {
    throw new BadRequestException('Email already exists');
  }

  const staff = new this.staffModel({
    ...dto,
    isVerified: true,
    isActive: true,
    availability: 'Off Shift',
    permissions: ['admin', 'manage_staff'],
    emrAccessLevel: 'admin',
  });

  const saved = await staff.save();

  const token = this.jwtService.sign({
    sub: saved._id.toString(),
    email: saved.email,
    hospitalId: saved.hospital?.toString(),
    role: saved.position,
    permissions: saved.permissions || [],
    type: 'staff',
  });

  return { staff: saved, token };
}


  async findAll(hospitalId?: string, department?: string, availability?: string): Promise<StaffDocument[]> {
    const query: any = { isActive: true };
    
    if (hospitalId) {
      query.hospital = new Types.ObjectId(hospitalId);
    }
    
    if (department) {
      query.department = department;
    }
    
    if (availability) {
      query.availability = availability;
    }
    
    return this.staffModel.find(query).exec();
  }

  async findOne(id: string): Promise<StaffDocument> {
    const staff = await this.staffModel.findById(id).exec();
    
    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }
    
    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto): Promise<StaffDocument> {
    const existingStaff = await this.findOne(id);
    
    const updateData = { ...updateStaffDto };
    
    const updatedStaff = await this.staffModel
      .findOneAndUpdate({ _id: id }, { $set: updateData }, { new: true })
      .exec();
    
    if (!updatedStaff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }
    
    this.eventEmitter.emit('staff.updated', {
      hospitalId: updatedStaff.hospital,
      staff: updatedStaff,
    });
    
    return updatedStaff;
  }

  async remove(id: string): Promise<void> {
    const staff = await this.findOne(id);
    
    await this.staffModel.findByIdAndUpdate(id, { isActive: false }).exec();
    
    this.eventEmitter.emit('staff.removed', {
      hospitalId: staff.hospital,
      staffId: staff._id,
    });
  }

  async updateAvailability(id: string, availability: string): Promise<StaffDocument> {
    if (!['Available', 'Unavailable', 'On Shift', 'Off Shift'].includes(availability)) {
      throw new BadRequestException('Invalid availability status');
    }
    
    const staff = await this.findOne(id);
    
    staff.availability = availability;
    const updatedStaff = await staff.save();
    
    this.eventEmitter.emit('staff.availability_updated', {
      hospitalId: updatedStaff.hospital,
      staffId: updatedStaff._id,
      availability: updatedStaff.availability,
    });
    
    return updatedStaff;
  }

  async getStaffSummary(hospitalId: string): Promise<any> {
    try {
      new Types.ObjectId(hospitalId);
    } catch (error) {
      throw new BadRequestException('Invalid hospital ID');
    }
    
    const aggregationResult = await this.staffModel.aggregate([
      { $match: { hospital: new Types.ObjectId(hospitalId), isActive: true } },
      { $group: {
          _id: '$availability',
          count: { $sum: 1 },
          departments: {
            $push: {
              department: '$department',
              position: '$position',
              name: '$name'
            }
          }
        }
      },
      {
        $project: {
          availability: '$_id',
          count: 1,
          departments: 1,
          _id: 0
        }
      }
    ]).exec();
    
    const result = {
      total: 0,
      onShift: 0,
      available: 0,
      unavailable: 0,
      offShift: 0,
      byDepartment: {},
      byPosition: {}
    };
    
    aggregationResult.forEach(item => {
      result.total += item.count;
      
      if (item.availability === 'On Shift') {
        result.onShift = item.count;
      } else if (item.availability === 'Available') {
        result.available = item.count;
      } else if (item.availability === 'Unavailable') {
        result.unavailable = item.count;
      } else if (item.availability === 'Off Shift') {
        result.offShift = item.count;
      }
      
      item.departments.forEach(staff => {
        if (!result.byDepartment[staff.department]) {
          result.byDepartment[staff.department] = {
            total: 0,
            onShift: 0,
            available: 0,
            unavailable: 0,
            offShift: 0
          };
        }
        
        result.byDepartment[staff.department].total++;
        
        if (item.availability === 'On Shift') {
          result.byDepartment[staff.department].onShift++;
        } else if (item.availability === 'Available') {
          result.byDepartment[staff.department].available++;
        } else if (item.availability === 'Unavailable') {
          result.byDepartment[staff.department].unavailable++;
        } else if (item.availability === 'Off Shift') {
          result.byDepartment[staff.department].offShift++;
        }
        
        if (!result.byPosition[staff.position]) {
          result.byPosition[staff.position] = {
            total: 0,
            onShift: 0,
            available: 0,
            unavailable: 0,
            offShift: 0
          };
        }
        
        result.byPosition[staff.position].total++;
        
        if (item.availability === 'On Shift') {
          result.byPosition[staff.position].onShift++;
        } else if (item.availability === 'Available') {
          result.byPosition[staff.position].available++;
        } else if (item.availability === 'Unavailable') {
          result.byPosition[staff.position].unavailable++;
        } else if (item.availability === 'Off Shift') {
          result.byPosition[staff.position].offShift++;
        }
      });
    });
    
    return result;
  }
}