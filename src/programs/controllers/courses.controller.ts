import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProgramsService } from '../services/programs.service';
import { CreateCourseDto, ListCoursesDto, UpdateCourseDto } from '../dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.programsService.createCourse(createCourseDto);
  }

  @Get()
  findAll(@Query() listCoursesDto: ListCoursesDto) {
    return this.programsService.listCourses(listCoursesDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findCourse(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.programsService.updateCourse(id, updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programsService.removeCourse(id);
  }
}
