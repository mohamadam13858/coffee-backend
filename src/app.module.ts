import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { InventoryModule } from './inventory/inventory.module';
import { TableModule } from './table/table.module';
import { OrdersModule } from './orders/orders.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PaymentsModule } from './payments/payments.module';
import { StaffModule } from './staff/staff.module';
import { CustomersModule } from './customers/customers.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm';
import { configValidationSchema } from './config.Schema';

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: [`.env.stage.${process.env.STAGE}`],
    validationSchema: configValidationSchema
  }),
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      type: 'postgres',
      autoLoadEntities: true,
      synchronize: configService.get('STAGE') === 'dev',
      host: configService.get('DB_HOST'),
      port: configService.get('DB_PORT'),
      username: configService.get('DB_USERNAME'),
      password: configService.get('DB_PASSWORD'),
      database: configService.get('DB_DATABASE')
    })
  }), UsersModule, AuthModule, MenuModule, InventoryModule, TableModule, OrdersModule, ReservationsModule, PaymentsModule, StaffModule, CustomersModule, ReportsModule, SettingsModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
