import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Table } from 'src/table/entities/table.entity';
import { TableStatus } from 'src/table/table-status.enum';

export const RESERVATION_TTL_MINUTES = 10;

@Injectable()
export class ReservationsService {
    constructor(private dataSource: DataSource) { }

    async reserveTable(tableId: string, userId: string): Promise<Table> {
        return this.dataSource.transaction(async (manager) => {
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
}