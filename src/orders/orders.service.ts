import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { OrderItem } from './entities/order-item.entity';
import { Product } from 'src/menu/entities/product.entity';
import { Table } from 'src/table/entities/table.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from 'src/users/entities/user.entity';
import { TableStatus } from 'src/table/table-status.enum';
import { OrderStatus } from './order-status.enum';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { plainToInstance } from 'class-transformer';
import { OrderResponseDto } from './dto/order-response.dto';
import { GetOrdersFilterDto } from './dto/get-order-filter.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,

        private dataSource: DataSource

    ) { }

    async createOrder(createOrderDto: CreateOrderDto, user: User) {
        const { tableId, notes, items } = createOrderDto

        return await this.dataSource.transaction(async (manager) => {
            const table = await manager.findOne(Table, {
                where: { id: tableId },
                lock: { mode: 'pessimistic_write' }
            })

            if (!table) {
                throw new NotFoundException('میز پیدا نشد')
            }

            if (table.isActive === false) {
                throw new BadRequestException('این میز غیر فعال است')
            }

            const reservationExpired =
                table.status === TableStatus.RESERVED && (!table.reservedUntil || table.reservedUntil.getTime() < Date.now())

            const isMyActiveReservation =
                table.status === TableStatus.RESERVED &&
                table.reservedByUserId === user.id &&
                !reservationExpired

            const isAvailable = table.status === TableStatus.AVAILABLE

            if (!isAvailable && !isMyActiveReservation) {
                if (table.status === TableStatus.RESERVED && reservationExpired) {
                    throw new BadRequestException(
                        'زمان رزرو این میز به پایان رسیده است، دوباره میز را انتخاب کنید',
                    )
                }
                throw new BadRequestException('این میز در حال حاضر آزاد نیست')
            }

            const productIds = items.map((item) => item.productId)
            const products = await manager.find(Product, {
                where: { id: In(productIds) }
            })

            if (products.length !== new Set(productIds).size) {
                throw new NotFoundException('یک یا چند محصول پیدا نشد')
            }

            const productMap = new Map(products.map((p) => [p.id, p]))

            let totalAmount = 0

            const orderItemData: Partial<OrderItem>[] = []

            for (const item of items) {
                const product = productMap.get(item.productId)

                if (!product) {
                    throw new NotFoundException('محصول با این شناسه پیدا نشد')
                }

                if (product.isActive === false) {
                    throw new BadRequestException('محصول غیر فعال است')
                }

                if (!product.isAvailable) {
                    throw new BadRequestException('محصول موجود نیست')
                }

                if (product.stock < item.quantity) {
                    throw new BadRequestException(
                        `موجودی محصول کافی نیست`
                    )
                }
                const unitPrice = Number(product.discountPrice ?? product.price)
                const totalPrice = unitPrice * item.quantity
                totalAmount += totalPrice

                orderItemData.push({
                    productId: product.id,
                    quantity: item.quantity,
                    unitPrice,
                    totalPrice
                })
            }

            const discountAmount = 0

            const order = manager.create(Order, {
                status: OrderStatus.PENDING,
                totalAmount,
                discountAmount,
                finalAmount: totalAmount - discountAmount,
                notes,
                userId: user.id,
                tableId
            })

            const savedOrder = await manager.save(order)

            const orderItems = orderItemData.map((item) => manager.create(OrderItem, {
                ...item,
                orderId: savedOrder.id
            }))

            await manager.save(orderItems)

            for (const item of items) {
                await manager.decrement(Product, { id: item.productId }, 'stock', item.quantity)
            }

            table.status = TableStatus.OCCUPIED
            table.reservedByUserId = null
            table.reservedUntil = null

            await manager.save(table)

            const fullOrder = await manager.findOne(Order, {
                where: { id: savedOrder.id },
                relations: {
                    items: {
                        product: true
                    },
                    table: true,
                    user: true
                }
            })

            if (!fullOrder) {
                throw new NotFoundException('سفارش ایجاد شد اما قابل بازیابی نبود')
            }

            return plainToInstance(OrderResponseDto, fullOrder, {
                excludeExtraneousValues: true
            })
        })
    }


    async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
        const { status } = updateOrderStatusDto
        return await this.dataSource.transaction(async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id },
                relations: {
                    table: true
                },
                lock: { mode: 'pessimistic_write' }
            })


            if (!order) {
                throw new NotFoundException('سفارش پیدا نشد')
            }


            if (order.status === status) {
                return {
                    id: order.id,
                    status: order.status,
                    tableId: order.tableId,
                    updatedAt: order.updatedAt
                }
            }


            if (
                order.status === OrderStatus.DELIVERED ||
                order.status === OrderStatus.CANCELLED
            ) {

                throw new BadRequestException('این سفارش قابل تغییر وضعیت نیست')

            }



            const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
                [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
                [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
                [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
                [OrderStatus.DELIVERED]: [],
                [OrderStatus.CANCELLED]: [],
            };

            const allowed = allowedTransitions[order.status] || [];
            if (!allowed.includes(status)) {
                throw new BadRequestException(
                    `تغییر وضعیت از "${order.status}" به "${status}" مجاز نیست`,
                );
            }



            order.status = status
            const savedOrder = await manager.save(order)

            if (status === OrderStatus.CANCELLED) {
                const orderItems = await manager.find(OrderItem, {
                    where: { orderId: order.id }
                })

                for (const item of orderItems) {
                    await manager.increment(
                        Product,
                        { id: item.productId },
                        'stock',
                        item.quantity
                    )
                }
            }

            if (
                (status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED) && order.tableId
            ) {
                const activeOrdersCount = await manager.count(Order, {
                    where: {
                        tableId: order.tableId,
                        status: In([
                            OrderStatus.PENDING,
                            OrderStatus.PREPARING,
                            OrderStatus.READY
                        ])
                    }
                })

                if (activeOrdersCount === 0) {
                    await manager.update(Table, order.tableId, {
                        status: TableStatus.AVAILABLE
                    })
                }
            }


            return {
                id: savedOrder.id,
                status: savedOrder.status,
                tableId: savedOrder.tableId,
                updatedAt: savedOrder.updatedAt
            }


        })
    }



    async findAll(filterDto: GetOrdersFilterDto) {
        const { search, status, tableId, page = 1, limit = 10 } = filterDto

        const pageNumber = Math.max(Number(page) || 1, 1)
        const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100)


        const query = this.orderRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.table', 'table')

        if (search?.trim()) {
            const normalizedSearch = `%${search.trim()}%`
            query.andWhere(
                `(order.notes ILIKE :search OR table.number ILIKE :search)`,
                { search: normalizedSearch },
            );
        }

        if (status) {
            query.andWhere('order.status = :status', { status });
        }

        if (tableId) {
            query.andWhere('order.tableId = :tableId', { tableId });
        }

        query
            .orderBy('order.createdAt', 'DESC')
            .addOrderBy('order.id', 'DESC')
            .skip((pageNumber - 1) * limitNumber)
            .take(limitNumber)




        try {
            const [orders, total] = await query.getManyAndCount()

            return {
                data: plainToInstance(OrderResponseDto, orders, {
                    excludeExtraneousValues: true
                }),
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPage: Math.ceil(total / limitNumber)
            }

        } catch (error) {
            throw new InternalServerErrorException()
        }
    }



    async findOne(id: string, user: User) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: {
                items: {
                    product: true
                },
                table: true
            }
        })

        if (!order || !this.canAccessOrder(order, user)) {
            throw new NotFoundException('سفارش پیدا نشد')
        }

        return plainToInstance(OrderResponseDto, order, {
            excludeExtraneousValues: true
        })
    }


    async findMyOrders(userId: string, filterDto: GetOrdersFilterDto) {
        const { status, page = 1, limit = 10 } = filterDto
        const pageNumber = Math.max(Number(page) || 1, 1);
        const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

        const query = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.table', 'table')
            .where('order.userId = :userId', { userId })

        if (status) {
            query.andWhere('order.status = :status', { status });
        }



        query
            .orderBy('order.createdAt', 'DESC')
            .skip((pageNumber - 1) * limitNumber)
            .take(limitNumber)

        const [orders, total] = await query.getManyAndCount()

        return {
            data: plainToInstance(OrderResponseDto, orders, {
                excludeExtraneousValues: true,
            }),
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        };
    }

    async addItem(orderId: string, dto: AddOrderItemDto, user: User): Promise<OrderResponseDto> {
        return this.dataSource.transaction(async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id: orderId },
                lock: { mode: 'pessimistic_write' }
            })

            if (!order || !this.canAccessOrder(order, user)) {
                throw new NotFoundException('سفارش پیدا نشد')
            }

            if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)) {
                throw new BadRequestException('این سفارش قابل ویرایش نیست')
            }

            if (user.role !== 'admin' && order.status !== OrderStatus.PENDING) {
                throw new BadRequestException('سفارش تایید شده را نمی‌توان ویرایش کرد')
            }

            const product = await manager.findOne(Product, {
                where: { id: dto.productId }
            })

            if (!product) throw new NotFoundException('محصول پیدا نشد')
            if (!product.isActive || !product.isAvailable) {
                throw new BadRequestException('محصول در دسترس نیست')
            }
            if (product.stock < dto.quantity) {
                throw new BadRequestException(
                    `موجودی محصول "${product.name}" کافی نیست. موجودی فعلی: ${product.stock}`,
                );
            }

            const unitPrice = Number(product.discountPrice ?? product.price)

            const existingItem = await manager.findOne(OrderItem, {
                where: {
                    orderId: order.id,
                    productId: product.id
                }
            })

            if (existingItem) {
                existingItem.quantity += dto.quantity
                existingItem.unitPrice = unitPrice
                existingItem.totalPrice = unitPrice * existingItem.quantity
                await manager.save(existingItem)
            } else {
                const item = manager.create(OrderItem, {
                    orderId: order.id,
                    productId: product.id,
                    quantity: dto.quantity,
                    unitPrice,
                    totalPrice: unitPrice * dto.quantity
                })

                await manager.save(item)
            }

            await manager.decrement(Product, { id: product.id }, 'stock', dto.quantity);

            await this.recalculateOrderTotals(manager, orderId)

            const fullOrder = await manager.findOne(Order, {
                where: { id: orderId },
                relations: {
                    items: { product: true },
                    table: true
                }
            })

            return plainToInstance(OrderResponseDto, fullOrder, {
                excludeExtraneousValues: true
            })
        })
    }

    async removeItem(orderId: string, itemId: string, user: User): Promise<OrderResponseDto> {
        return await this.dataSource.transaction(async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id: orderId },
                lock: { mode: 'pessimistic_write' }
            })

            if (!order || !this.canAccessOrder(order, user)) {
                throw new NotFoundException('سفارش پیدا نشد')
            }

            if (
                order.status === OrderStatus.DELIVERED ||
                order.status === OrderStatus.CANCELLED
            ) {
                throw new BadRequestException('این سفارش قابل ویرایش نیست')
            }

            if (user.role !== 'admin' && order.status !== OrderStatus.PENDING) {
                throw new BadRequestException('سفارش تایید شده را نمی‌توان ویرایش کرد')
            }

            const item = await manager.findOne(OrderItem, {
                where: { id: itemId, orderId }
            })

            if (!item) {
                throw new NotFoundException('ایتم سفارش پیدا نشد')
            }

            await manager.increment(
                Product,
                { id: item.productId },
                'stock',
                item.quantity,
            );

            await manager.remove(item)

            await this.recalculateOrderTotals(manager, orderId)

            const fullOrder = await manager.findOne(Order, {
                where: { id: orderId },
                relations: {
                    items: { product: true },
                    table: true
                }
            })

            return plainToInstance(OrderResponseDto, fullOrder, {
                excludeExtraneousValues: true
            })
        })
    }


    async updateItemQuantity(orderId: string, itemId: string, dto: UpdateOrderItemDto, user: User): Promise<OrderResponseDto> {
        return await this.dataSource.transaction(async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id: orderId },
                lock: { mode: 'pessimistic_write' }
            })

            if (!order || !this.canAccessOrder(order, user)) {
                throw new NotFoundException('سفارش پیدا نشد')
            }

            if (
                order.status === OrderStatus.DELIVERED ||
                order.status === OrderStatus.CANCELLED
            ) {
                throw new BadRequestException('این سفارش قابل ویرایش نیست')
            }

            if (user.role !== 'admin' && order.status !== OrderStatus.PENDING) {
                throw new BadRequestException('سفارش تایید شده را نمی‌توان ویرایش کرد')
            }

            const item = await manager.findOne(OrderItem, {
                where: { id: itemId, orderId }
            })

            if (!item) {
                throw new NotFoundException('ایتم سفارش پیدا نشد')
            }

            if (dto.quantity <= 0) {
                await manager.increment(
                    Product,
                    { id: item.productId },
                    'stock',
                    item.quantity
                )
                await manager.remove(item)
            } else {
                const diff = dto.quantity - item.quantity
                if (diff > 0) {
                    const product = await manager.findOne(Product, {
                        where: { id: item.productId },
                        lock: { mode: 'pessimistic_write' }
                    })

                    if (!product) {
                        throw new NotFoundException('محصول پیدا نشد')
                    }

                    if (product.stock < diff) {
                        throw new BadRequestException(
                            `موجودی محصول "${product.name}" کافی نیست. موجودی فعلی: ${product.stock}`,
                        );
                    }

                    await manager.decrement(Product, { id: product.id }, 'stock', diff)
                } else if (diff < 0) {
                    await manager.increment(Product, { id: item.productId }, 'stock', Math.abs(diff))
                }
                item.quantity = dto.quantity
                item.totalPrice = Number(item.unitPrice) * dto.quantity
                await manager.save(item)
            }

            await this.recalculateOrderTotals(manager, orderId)

            const fullOrder = await manager.findOne(Order, {
                where: { id: orderId },
                relations: {
                    items: { product: true },
                    table: true
                }
            })

            return plainToInstance(OrderResponseDto, fullOrder, {
                excludeExtraneousValues: true
            })
        })
    }


    async confirmOrder(id: string, user: User) {
        return await this.dataSource.transaction(async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id },
                lock: { mode: 'pessimistic_write' }
            })

            if (!order || !this.canAccessOrder(order, user)) {
                throw new NotFoundException('سفارش پیدا نشد')
            }

            if (order.status !== OrderStatus.PENDING) {
                throw new BadRequestException('این سفارش قابلیت تایید ندارد')
            }

            const itemsCount = await manager.count(OrderItem, {
                where: { orderId: id }
            })

            if (itemsCount === 0) {
                throw new BadRequestException('سفارش خالی است، ابتدا آیتم اضافه کنید')
            }

            order.status = OrderStatus.PREPARING
            const savedOrder = await manager.save(order)

            const fullOrder = await manager.findOne(Order, {
                where: { id: savedOrder.id },
                relations: {
                    items: { product: true },
                    table: true
                }
            })

            return plainToInstance(OrderResponseDto, fullOrder, {
                excludeExtraneousValues: true
            })
        })
    }

    private async recalculateOrderTotals(manager: EntityManager, orderId: string): Promise<void> {
        const result = await manager
            .createQueryBuilder(OrderItem, 'item')
            .select(`COALESCE(SUM(item.totalPrice) , 0)`, 'sum')
            .where('item.orderId = :orderId', { orderId })
            .getRawOne()


        const totalAmount = Number(result?.sum) || 0

        const order = await manager.findOne(Order, { where: { id: orderId } })
        if (!order) return

        order.totalAmount = totalAmount
        order.finalAmount = totalAmount - Number(order.discountAmount || 0)

        await manager.save(order)
    }


    private canAccessOrder(order: Order, user: User): boolean {
        return user.role === 'admin' || order.userId === user.id
    }
}




