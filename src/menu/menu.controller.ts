import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { MenuService } from './menu.service';
import { GetProductsFilterDto } from './dto/get-products-filter.dto';
import { Product } from './entities/product.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Category } from './entities/category.entity';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import { ProductResponseDto } from './dto/product-response.dto';

@Controller('menu')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MenuController {
    constructor(private menuService: MenuService) { }

    @Post('categories')
    @UseInterceptors(FileInterceptor('image', {
        storage: memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024
        },
        fileFilter: (req, file, callback) => {
            const allowedMImeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
            if (!allowedMImeTypes.includes(file.mimetype)) {
                return callback(new BadRequestException('فقط فایل های jpg png webp jpeg مجاز است '), false)
            }

            callback(null, true)
        }
    }))
    @Roles('admin')
    createCategory(@Body() createCategory: CreateCategoryDto, @UploadedFile() image?: Express.Multer.File): Promise<Category> {
        return this.menuService.createCategory(createCategory, image)
    }

    @Get('categories')
    getAllCategory(): Promise<Category[]> {
        return this.menuService.getAllCategory()
    }


    @Patch('categories/:id')
    @UseInterceptors(FileInterceptor('image', {
        storage: memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024
        }
    }))
    @Roles('admin')
    updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto, @UploadedFile() image?: Express.Multer.File): Promise<Category> {
        return this.menuService.updateCategory(id, updateCategoryDto, image)
    }


    @Delete('categories/:id')
    @Roles('admin')
    deleteCategory(@Param('id') id: string): Promise<void> {
        return this.menuService.deleteCategory(id)
    }

    @Get('products')
    getAllProducts(@Query() filterDto: GetProductsFilterDto): Promise<PaginatedResponse<ProductResponseDto>> {
        return this.menuService.getProducts(filterDto)
    }

    @Post('product')
    @UseInterceptors(FileInterceptor('image', {
        storage: memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024
        }
    }))
    @Roles('admin')
    createProduct(@Body() createProductDto: CreateProductDto, @UploadedFile() image: Express.Multer.File): Promise<Product> {
        return this.menuService.createProduct(createProductDto, image)
    }

    @Patch('product/:id')
    @UseInterceptors(FileInterceptor('image', {
        storage: memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024
        }
    }))
    @Roles('admin')
    updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @UploadedFile() image: Express.Multer.File): Promise<Product> {
        return this.menuService.updateProduct(id, updateProductDto, image)
    }


    @Delete('product/:id')
    @Roles('admin')
    deleteProduct(@Param('id') id: string): Promise<void> {
        return this.menuService.deleteProduct(id)
    }

}
