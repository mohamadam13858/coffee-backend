import { Order } from "src/orders/entities/order.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { TableStatus } from "../table-status.enum";


@Entity()
export class Table {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column({ unique: true })
    number: string
    @Column({ type: 'enum', enum: TableStatus, default: TableStatus.AVAILABLE })
    status: TableStatus
    @Column({ nullable: true })
    capacity?: number
    @Column({ type: 'timestamptz', nullable: true })
    reservedUntil: Date | null
    @Column({  type: 'uuid' , nullable: true })
    reservedByUserId: string | null
    @Column({ default: true })
    isActive: boolean
    @OneToMany(() => Order, (order) => order.table)
    orders: Order[]
    @CreateDateColumn()
    createdAt: Date
    @UpdateDateColumn()
    updatedAt: Date
    @DeleteDateColumn()
    deletedAt: Date
}