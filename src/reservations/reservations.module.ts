import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from 'src/table/entities/table.entity';
import { Order } from 'src/orders/entities/order.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Table, Order])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}