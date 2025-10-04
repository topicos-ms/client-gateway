import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TeachingService } from '../services/teaching.service';
import {
  CreateCourseSectionDto,
  ListCourseSectionsDto,
  UpdateCourseSectionDto,
} from '../dto';

@Controller('course-sections')
export class CourseSectionsController {
  constructor(private readonly teachingService: TeachingService) {}

  @Post()
  create(@Body() createCourseSectionDto: CreateCourseSectionDto) {
    return this.teachingService.createCourseSection(createCourseSectionDto);
  }

  @Get()
  findAll(@Query() listCourseSectionsDto: ListCourseSectionsDto) {
    return this.teachingService.listCourseSections(listCourseSectionsDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachingService.findCourseSection(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseSectionDto: UpdateCourseSectionDto) {
    return this.teachingService.updateCourseSection(id, updateCourseSectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teachingService.removeCourseSection(id);
  }
}
