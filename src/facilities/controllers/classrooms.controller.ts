import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { FacilitiesService } from '../services/facilities.service';
import {
  CreateClassroomDto,
  ListClassroomsDto,
  UpdateClassroomDto,
} from '../dto';

@Controller('classrooms')
export class ClassroomsController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Post()
  create(@Body() createClassroomDto: CreateClassroomDto) {
    return this.facilitiesService.createClassroom(createClassroomDto);
  }

  @Get()
  findAll(@Query() listClassroomsDto: ListClassroomsDto) {
    return this.facilitiesService.findClassrooms(listClassroomsDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facilitiesService.findClassroomById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClassroomDto: UpdateClassroomDto,
  ) {
    return this.facilitiesService.updateClassroom(id, updateClassroomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.facilitiesService.removeClassroom(id);
  }
}
