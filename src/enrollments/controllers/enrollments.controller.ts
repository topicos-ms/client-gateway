import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnrollmentsService } from '../services/enrollments.service';
import {
  CreateEnrollmentDto,
  ListEnrollmentsDto,
  UpdateEnrollmentDto,
} from '../dto';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.createEnrollment(createEnrollmentDto);
  }

  @Get()
  findAll(@Query() listEnrollmentsDto: ListEnrollmentsDto) {
    return this.enrollmentsService.findEnrollments(listEnrollmentsDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findEnrollmentById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnrollmentDto: UpdateEnrollmentDto) {
    return this.enrollmentsService.updateEnrollment(id, updateEnrollmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollmentsService.removeEnrollment(id);
  }
}
