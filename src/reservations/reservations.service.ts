import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Table } from 'src/table/entities/table.entity';
import { TableStatus } from 'src/table/table-status.enum';
import { Order } from 'src/orders/entities/order.entity';
import { OrderStatus } from 'src/orders/order-status.enum';

export const RESERVATION_TTL_MINUTES = 10;

const ACTIVE_ORDER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

@Injectable()
export class ReservationsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async reserveTable(tableId: string, userId: string): Promise<Table> {
    return this.dataSource.transaction(async (manager) => {
      const activeOrder = await manager.findOne(Order, {
        where: { userId, status: In(ACTIVE_ORDER_STATUSES) },
        relations: { table: true },
      });

      if (activeOrder && activeOrder.tableId !== tableId) {
        throw new ConflictException(
          `شما سفارش در حال انجام روی میز ${activeOrder.table?.number ?? ''} دارید. تا تحویل‌گرفتن سفارش امکان انتخاب میز دیگری وجود ندارد`,
        );
      }

      const table = await manager.findOne(Table, {
        where: { id: tableId, isActive: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!table) {
        throw new NotFoundException('میز پیدا نشد');
      }

      const reservationExpired =
        table.status === TableStatus.RESERVED &&
        (!table.reservedUntil || table.reservedUntil.getTime() < Date.now());

      const alreadyMine =
        table.status === TableStatus.RESERVED &&
        table.reservedByUserId === userId &&
        !reservationExpired;

      const isClaimable =
        table.status === TableStatus.AVAILABLE || reservationExpired;

      if (!alreadyMine && !isClaimable) {
        throw new ConflictException('این میز الان در دسترس نیست');
      }

      await manager
        .createQueryBuilder()
        .update(Table)
        .set({
          status: TableStatus.AVAILABLE,
          reservedByUserId: null,
          reservedUntil: null,
        })
        .where(
          'reservedByUserId = :userId AND id != :tableId AND status = :status',
          { userId, tableId, status: TableStatus.RESERVED },
        )
        .execute();

      table.status = TableStatus.RESERVED;
      table.reservedByUserId = userId;
      table.reservedUntil = new Date(
        Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000,
      );

      try {
        return await manager.save(table);
      } catch {
        throw new InternalServerErrorException();
      }
    });
  }

  async releaseTable(tableId: string, userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const table = await manager.findOne(Table, {
        where: { id: tableId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!table) {
        throw new NotFoundException('میز پیدا نشد');
      }

      if (
        table.status !== TableStatus.RESERVED ||
        table.reservedByUserId !== userId
      ) {
        return;
      }

      table.status = TableStatus.AVAILABLE;
      table.reservedByUserId = null;
      table.reservedUntil = null;

      await manager.save(table);
    });
  }

  async getMyCurrentTable(
    userId: string,
  ): Promise<{ table: Table; activeOrderId: string | null } | null> {
    const activeOrder = await this.orderRepository.findOne({
      where: { userId, status: In(ACTIVE_ORDER_STATUSES) },
      relations: { table: true },
      order: { createdAt: 'DESC' },
    });

    if (activeOrder?.table) {
      return { table: activeOrder.table, activeOrderId: activeOrder.id };
    }

    const reservedTable = await this.tableRepository.findOne({
      where: { reservedByUserId: userId, status: TableStatus.RESERVED },
    });

    if (reservedTable) {
      const isExpired =
        !reservedTable.reservedUntil ||
        reservedTable.reservedUntil.getTime() < Date.now();

      if (!isExpired) {
        return { table: reservedTable, activeOrderId: null };
      }
    }

    return null;
  }
}