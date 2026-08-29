import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "../enums/role.enum";
import { Exclude } from "class-transformer";



@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column({ unique: true })
    mobile: string
    @Column({ unique: true, nullable: true })
    email: string
    @Column()
    @Exclude()
    password: string
    @Column({ type: 'enum', enum: Role })
    role: Role
    @Column({ length: 100, nullable: true })
    firstName: string
    @Column({ length: 100, nullable: true })
    lastName: string
    @Column({ default: true })
    isActive: boolean
    @Column({ type: 'text', nullable: true, default: null })
    @Exclude()
    refreshToken: string | null;
    @CreateDateColumn()
    createdAt: Date
    @UpdateDateColumn()
    updatedAt: Date
    @DeleteDateColumn()
    deletedAt: Date
}
