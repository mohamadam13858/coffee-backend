import { Body, Controller, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }


  @Post('signup')
  @ApiOperation({summary: 'ثبت نام کابر جدید'})
  signup(@Body() registerDto: RegisterDto): Promise<void> {
    return this.authService.register(registerDto)
  }


  @Post('signin')
  @ApiOperation({summary: 'ورود کاربر و دریافت توکن'})
  async signin(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto)
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    })

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return result
  }


  @Post('refresh')
  @ApiOperation({summary:'دریافت accessToken با استفاده از refreshToken'})
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refreshToken?: string }
  ) {
    const token = body?.refreshToken || req.cookies?.['refresh_token']

    if (!token) {
      throw new UnauthorizedException('رفرش توکن بافت نشد')
    }

    const result = await this.authService.refresh(token)

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token' , result.refreshToken , {
      httpOnly: true , 
      secure: process.env.NODE_ENV === 'production' , 
      sameSite: 'lax' , 
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return result;
  }

  @Post('logout')
  @ApiBearerAuth('access_token')
  @ApiOperation({summary: 'باطل کردن refreshToken و خروج کاربر'})
  @UseGuards(AuthGuard('jwt'))
  async logout(
    @GetUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'با موفقیت خارج شدید' };
  }




}
