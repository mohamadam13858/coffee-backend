import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { CreateTableDto } from './dto/create-table.dto';
import { Roles } from 'src/auth/roles.decorator';
import { TableService } from './table.service';
import { Table } from './entities/table.entity';
import { UpdateTableDto } from './dto/update-table.dto';
import { ChangeStatusTableDto } from './dto/change-status-table.dto';

@Controller('table')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TableController {
    constructor(private tableService: TableService) { }

    @Post()
    @Roles('admin')
    createTable(@Body() createTableDto: CreateTableDto): Promise<Table> {
        return this.tableService.createTable(createTableDto);
    }

    @Get()
    findAllTable(): Promise<Table[]> {
        return this.tableService.findAllTable();
    }

    @Get('available')
    findAvailable(): Promise<Table[]> {
        return this.tableService.findAvailable();
    }

    @Get(':id')
    findOneTable(@Param('id') id: string): Promise<Table> {
        return this.tableService.findOneTable(id);
    }

    @Patch(':id')
    @Roles('admin')
    updateTable(
        @Param('id') id: string,
        @Body() updateTableDto: UpdateTableDto
    ): Promise<Table> {
        return this.tableService.updateTable(id, updateTableDto);
    }


    @Patch(':id/status')
    @Roles('admin')
    changeStatus(
        @Param('id') id: string,
        @Body() changeStatusTableDto: ChangeStatusTableDto
    ): Promise<Table> {
        return this.tableService.changeStatus(id, changeStatusTableDto);
    }

    @Delete(':id')
    @Roles('admin')
    deleteTable(@Param('id') id: string): Promise<void> {
        return this.tableService.deleteTable(id);
    }
}