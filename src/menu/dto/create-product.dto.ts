import { IsBoolean, isNotEmpty, IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";



export class CreateProductDto {
    @IsNotEmpty()
    name: string
    @IsOptional()
    description?: string
    @IsNotEmpty()
    @IsNumber()
    price: number
    @IsOptional()
    @IsNumber()
    discountPrice?: number
    @IsOptional()
    @IsUUID()
    categoryId: string
    @IsOptional()
    @IsNumber()
    stock?: number
    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean
} 