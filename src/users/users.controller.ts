import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { UsersService } from './users.service';
import { Roles } from 'src/auth/roles.decorator';
import { UserResponseDto } from './dto/user.response.dto';
import { UserRoleDto } from './dto/update-user-role.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from './entities/user.entity';
import { GetUserFilterDto } from './dto/get-user-filter.dto';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }


    @Get()
    @Roles('admin')
    getAllUsers(@Query() filterDto: GetUserFilterDto): Promise<PaginatedResponse<UserResponseDto>> {
        return this.usersService.getAllUsers(filterDto)
    }



    @Get('/me')
    getMe(@GetUser() user: User) {
        return this.usersService.getMe(user.id);
    }


    @Patch('/me')
    updateProfile(@GetUser() user: User, @Body() updateProfileDto: UpdateProfileDto): Promise<UserResponseDto> {
        return this.usersService.updateProfile(user.id, updateProfileDto)
    }


    @Get(':id')
    @Roles('admin')
    getUser(@Param('id') id: string): Promise<UserResponseDto> {
        return this.usersService.getUser(id)
    }

    @Patch(':id/role')
    @Roles('admin')
    changeUserRole(@Param('id') id: string, @Body() userRoleDto: UserRoleDto, @GetUser() user: User): Promise<UserResponseDto> {
        return this.usersService.changeUserRole(id, userRoleDto, user)
    }


    @Patch(':id/block')
    @Roles('admin')
    changeStatus(@Param('id') id: string, @Body() blockUserDto: BlockUserDto, @GetUser() user: User): Promise<UserResponseDto> {
        return this.usersService.changeStatus(id, blockUserDto, user)
    }


    @Delete(':id')
    @Roles('admin')
    removeUser(
        @Param('id') id: string,
        @GetUser() currentUser: User,
    ) {
        return this.usersService.removeUser(id, currentUser);
    }

}
