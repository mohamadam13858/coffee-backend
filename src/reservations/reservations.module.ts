import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from 'src/table/entities/table.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Table])], 
  controllers: [ReservationsController],
  providers: [ReservationsService]
})
export class ReservationsModule {}
