"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcrypt");
const hospital_schema_1 = require("../hospital/schemas/hospital.schema");
const user_service_1 = require("../user/user.service");
const hospital_service_1 = require("../hospital/hospital.service");
let AuthService = class AuthService {
    constructor(hospitalModel, hospitalService, UserService, jwtService) {
        this.hospitalModel = hospitalModel;
        this.hospitalService = hospitalService;
        this.UserService = UserService;
        this.jwtService = jwtService;
    }
    generateJwtToken(payload) {
        return this.jwtService.sign(payload);
    }
    async validateUser(email, pass) {
        const query = { email: email };
        const user = await this.UserService.findOne(query);
        if (!user)
            throw new common_1.NotFoundException('Email Does not exist');
        const isMatched = await this.comparePasswords(pass, user.password);
        if (!isMatched)
            throw new common_1.UnauthorizedException('Invalid Password');
        return user;
    }
    async login(loginDto) {
        const { uuid, email, password } = loginDto;
        if (uuid) {
            const hospital = await this.validateHospital(uuid, password);
            const payload = {
                sub: hospital.id,
                uuid: hospital.uuid,
                hospitalName: hospital.hospitalName,
                type: 'hospital'
            };
            return {
                access_token: this.jwtService.sign(payload),
                hospital,
                type: 'hospital'
            };
        }
        else {
            const user = await this.validateUser(email, password);
            const payload = {
                sub: user._id,
                email: user.email,
                name: user.name,
                type: 'user'
            };
            return {
                access_token: this.jwtService.sign(payload),
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name
                },
                type: 'user'
            };
        }
    }
    async validateToken(token) {
        try {
            return this.jwtService.verify(token);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
    async comparePasswords(password, hashedPassword) {
        return bcrypt
            .compare(password, hashedPassword)
            .then((isMatch) => {
            if (isMatch)
                return true;
            return false;
        })
            .catch((err) => err);
    }
    async getHashedPassword(password) {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    reject(err);
                }
                resolve(hash);
            });
        });
    }
    async validateHospital(usernameOrEmail, password) {
        const hospital = await this.hospitalService.validateHospital(usernameOrEmail, password);
        if (!hospital) {
            return null;
        }
        const payload = {
            sub: hospital._id,
            username: hospital.username,
            email: hospital.email,
            type: 'hospital'
        };
        return {
            access_token: this.jwtService.sign(payload),
            hospital: {
                id: hospital._id,
                username: hospital.username,
                email: hospital.email,
                hospitalName: hospital.hospitalName,
            }
        };
    }
};
AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => hospital_service_1.HospitalService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        hospital_service_1.HospitalService,
        user_service_1.UserService,
        jwt_1.JwtService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map