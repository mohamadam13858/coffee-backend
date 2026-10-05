import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Roles } from 'src/auth/roles.decorator';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { GetOrdersFilterDto } from './dto/get-order-filter.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Controller('orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrdersController {
    constructor(private ordersService: OrdersService) { }


    @Post()
    createOrder(@Body() createOrderDto: CreateOrderDto, @GetUser() user: User) {
        return this.ordersService.createOrder(createOrderDto, user)
    }


    @Patch(':id/status')
    @Roles('admin')
    updateStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
        return this.ordersService.updateStatus(id, updateOrderStatusDto)
    }


    @Post(':id/confirm')
    confirmOrder(@Param('id') id: string, @GetUser() user: User) {
        return this.ordersService.confirmOrder(id, user)
    }


    @Get()
    @Roles('admin')
    findAll(@Query() filterDto: GetOrdersFilterDto) {
        return this.ordersService.findAll(filterDto)
    }


    @Get('my')
    findMyOrders(
        @GetUser() user: User,
        @Query() filterDto: GetOrdersFilterDto
    ) {
        return this.ordersService.findMyOrders(user.id, filterDto)
    }


    @Get(':id')
    findOne(@Param('id') id: string, @GetUser() user: User) {
        return this.ordersService.findOne(id, user)
    }


    @Post(':id/items')
    addItem(@Param('id') id: string, @Body() addOrderItemDto: AddOrderItemDto, @GetUser() user: User) {
        return this.ordersService.addItem(id, addOrderItemDto, user)
    }


    @Patch(':id/items/:itemId')
    updateItemQuantity(
        @Param('id') id: string,
        @Param('itemId') itemId: string,
        @Body() updateOrderItemDto: UpdateOrderItemDto,
        @GetUser() user: User,
    ) {
        return this.ordersService.updateItemQuantity(id, itemId, updateOrderItemDto, user)
    }


    @Delete(':id/items/:itemId')
    removeItem(@Param('id') id: string, @Param('itemId') itemId: string, @GetUser() user: User) {
        return this.ordersService.removeItem(id, itemId, user)
    }
}