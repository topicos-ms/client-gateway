import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CalendarService } from '../services/calendar.service';
import {
  CreateAcademicYearDto,
  ListAcademicYearDto,
  UpdateAcademicYearDto,
} from '../dto';

@Controller('calendar/managements')
export class AcademicYearsController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  create(@Body() createAcademicYearDto: CreateAcademicYearDto) {
    return this.calendarService.createAcademicYear(createAcademicYearDto);
  }

  @Get()
  findAll(@Query() listAcademicYearDto: ListAcademicYearDto) {
    return this.calendarService.findAcademicYears(listAcademicYearDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarService.findOneAcademicYear(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAcademicYearDto: UpdateAcademicYearDto,
  ) {
    return this.calendarService.updateAcademicYear(id, updateAcademicYearDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calendarService.removeAcademicYear(id);
  }
}
