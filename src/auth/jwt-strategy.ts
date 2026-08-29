import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "../users/entities/user.entity";
import { Repository } from "typeorm";
import { jwtPayload } from "./jwt-payload-interface";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private configService: ConfigService
    ) {
        super({
            secretOrKey: configService.get('JWT_SECRET')!,
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken() , 
                (req) => {
                    if (req && req.cookies) {
                        return req.cookies['access_token'] || null;
                    }
                    return null
                }
            ])
        })
    }

    async validate(payload: jwtPayload): Promise<User> {
        const { id } = payload
        const user: User | null = await this.userRepository.findOne({ where: { id } })
        if (!user) {
            throw new UnauthorizedException()
        }

        if (user.isActive === false) {
            throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است');
        }

        if (user.deletedAt) {
            throw new UnauthorizedException('حساب کاربری حذف شده است');
        }

        return user
    }
}