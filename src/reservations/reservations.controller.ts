import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Table } from 'src/table/entities/table.entity';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
@UseGuards(AuthGuard('jwt'))
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Post('tables/:tableId')
  reserveTable(
    @Param('tableId') tableId: string,
    @GetUser() user: User,
  ): Promise<Table> {
    return this.reservationsService.reserveTable(tableId, user.id);
  }

  @Delete('tables/:tableId')
  releaseTable(
    @Param('tableId') tableId: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.reservationsService.releaseTable(tableId, user.id);
  }
}