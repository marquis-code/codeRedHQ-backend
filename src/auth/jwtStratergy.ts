
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Staff, StaffDocument } from '../staffing/schemas/staff.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use the same secret as in auth.module.ts
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Handle different token types (staff, user, hospital)
    if (payload.type === 'staff') {
      const staff = await this.staffModel.findById(payload.sub);
      
      if (!staff || !staff.isActive || !staff.isVerified) {
        throw new UnauthorizedException('Staff account is not active or verified');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        hospitalId: payload.hospitalId,
        role: payload.role,
        permissions: staff.permissions, // Use actual permissions from DB
        type: 'staff',
      };
    }

    // For other types (user, hospital), return payload as is
    return payload;
  }
}