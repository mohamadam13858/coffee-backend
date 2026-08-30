import { IsEmail, IsEnum, IsMobilePhone, IsNotEmpty, IsOptional, Length, Matches } from "class-validator";
import { Role } from "../../users/enums/role.enum";
import { ApiProperty } from "@nestjs/swagger";


export class RegisterDto {
    @ApiProperty({example: '09123456789'})
    @IsNotEmpty({ message: "شماره موبایل اجباری است" })
    @IsMobilePhone('fa-IR', {}, { message: 'شماره موبایل معتبر نیست' })
    mobile: string

    @ApiProperty({example: 'mohamad@gmail.com'})
    @IsOptional()
    @IsEmail({}, { message: 'ایمیل معتبر نیست' })
    email?: string


    @ApiProperty({example: '12345678' , minLength: 6} )
    @IsNotEmpty({ message: "رمز عبور اجباری است" })
    @Length(8, 25, { message: 'رمز عبور باید بین ۸ تا ۲۵ کاراکتر باشد' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'رمز عبور باید شامل حرف بزرگ. کوچک و عدد یا کاراکتر خاص باشد '
    })
    password: string



    @ApiProperty({example: 'mohamad1'})
    @IsOptional()
    @Length(2, 50, { message: 'نام باید بین ۲ تا ۵۰ کاراکتر باشد' })
    firstName?: string

    @ApiProperty({example: 'habibi'})
    @IsOptional()
    @Length(2, 50, { message: 'نام خانوادگی باید بین ۲ تا ۵۰ کاراکتر باشد' })
    lastName?: string


    @IsOptional()
    @IsEnum(Role, { message: 'نقش معتبر نیست' })
    role?: Role = Role.CUSTOMER




}