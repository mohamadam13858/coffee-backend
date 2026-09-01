import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt'
import { Role } from '../users/enums/role.enum';
import { LoginDto } from './dto/login.dto';
import { jwtPayload } from './jwt-payload-interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService
    ) { }


    async register(registerDto: RegisterDto): Promise<void> {
        const { firstName, lastName, mobile, email, role, password } = registerDto
        const existingUser = await this.userRepository.findOne({ where: { mobile } })
        if (existingUser) {
            throw new ConflictException('این شماره موبایل قبلا ثبت شده است')
        }
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(password, salt)
        const user = this.userRepository.create({
            mobile,
            email,
            firstName,
            lastName,
            role: Role.CUSTOMER,
            password: hashedPassword
        })

        try {

            await this.userRepository.save(user)

        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('این شماره موبایل قبلا ثبت شده است')
            } else {
                console.log(error)
                throw new InternalServerErrorException()
            }
        }
    }



    async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
        const { mobile, password } = loginDto
        const user = await this.userRepository.findOne({ where: { mobile } })

        if (user && (await bcrypt.compare(password, user.password))) {
            const payload: jwtPayload = { id: user.id, mobile: user.mobile, role: user.role }
            const accessToken = await this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: '15m',
            });

            const refreshToken = await this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            });


            const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)

            await this.userRepository.update(user.id, {
                refreshToken: hashedRefreshToken
            })

            return {
                accessToken,
                refreshToken
            }
        } else {
            throw new UnauthorizedException('رمز عبور یا موبایل اشتباه است لطفا مجدد تلاش کنید')
        }
    }


    async refresh(refreshToken: string) {
        let payload

        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET')
            })
        } catch {
            throw new UnauthorizedException('رفرش توکن نامعتبر است')
        }
        const user = await this.userRepository.findOne({
            where: { id: payload.id }
        })

        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('دسترسی غیر مجاز')
        }

        const isMatch = await bcrypt.compare(refreshToken, user.refreshToken)
        if (!isMatch) {
            await this.userRepository.update(user.id, { refreshToken: null })
            throw new UnauthorizedException('رفرش توکن نامعتبر است ')
        }

        const newPayload = {
            id: user.id,
            mobile: user.mobile,
            role: user.role
        }

        const accessToken = await this.jwtService.signAsync(newPayload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '15m',
        });

        const newRefreshToken = await this.jwtService.signAsync(newPayload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        })

        const hashedRefreshToken = await bcrypt.hash(newRefreshToken , 10)


        await this.userRepository.update(user.id , {
            refreshToken: hashedRefreshToken
        })

        return { accessToken, refreshToken: newRefreshToken }
    }


    async logout(userId: string) {
        await this.userRepository.update(userId, { refreshToken: null });
        return { message: 'با موفقیت خارج شدید' };
    }
}
