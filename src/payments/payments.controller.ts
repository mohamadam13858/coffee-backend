import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Roles } from 'src/auth/roles.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PaymentsController {
    constructor(
        private paymentsService: PaymentsService
    ) { }


    @Post()
    @Roles('admin')
    createPayment(@Body() dto: CreatePaymentDto, @GetUser() user: User) {
        return this.paymentsService.createPayment(dto, user)
    }


    @Get('order/:orderId/summary')
    @Roles('admin')
    getOrderPaymentSummary(@Param('orderId') orderId: string) {
        return this.paymentsService.getOrderPaymentSummary(orderId)
    }


    @Get('order/:orderId')
    @Roles('admin')
    findByOrder(@Param('orderId') orderId: string) {
        return this.paymentsService.findByOrder(orderId)
    }


    @Get(':id')
    @Roles('admin')
    findOne(@Param('id') id: string) {
        return this.paymentsService.findOne(id)
    }


    @Patch(':id/status')
    @Roles('admin')
    updateStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto): Promise<PaymentResponseDto> {
        return this.paymentsService.updateStatus(id, dto)
    }
}
