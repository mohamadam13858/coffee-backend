import { Expose, Type } from "class-transformer";


export class ProductBrieDto {
    @Expose()
    id: string

    @Expose()
    name: string

    @Expose()
    imageUrl?: string
}


export class OrderItemResponseDto {
    @Expose()
    id: string

    @Expose()
    quantity: number

    @Expose()
    unitPrice: number

    @Expose()
    totalPrice: number

    @Expose()
    @Type(() => ProductBrieDto)
    product: ProductBrieDto
}


export class TableBrieDto {
    @Expose()
    id: string

    @Expose()
    number: number

    @Expose()
    status: string
}


export class OrderResponseDto {
    @Expose()
    id: string

    @Expose()
    status: string

    @Expose()
    totalAmount: number

    @Expose()
    discountAmount: number

    @Expose()
    finalAmount: number

    @Expose()
    notes?: string

    @Expose()
    @Type(() => TableBrieDto)
    table: TableBrieDto

    @Expose()
    @Type(() => OrderItemResponseDto)
    items: OrderItemResponseDto[]

    @Expose()
    createdAt: Date

    @Expose()
    updatedAt: Date
}