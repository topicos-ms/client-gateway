import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TeachingService } from '../services/teaching.service';
import { CreateScheduleDto, ListSchedulesDto, UpdateScheduleDto } from '../dto';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly teachingService: TeachingService) {}

  @Post()
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.teachingService.createSchedule(createScheduleDto);
  }

  @Get()
  findAll(@Query() listSchedulesDto: ListSchedulesDto) {
    return this.teachingService.listSchedules(listSchedulesDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachingService.findSchedule(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.teachingService.updateSchedule(id, updateScheduleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teachingService.removeSchedule(id);
  }
}
