import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnrollmentsService } from '../services/enrollments.service';
import {
  CreateEnrollmentDetailDto,
  ListEnrollmentDetailsDto,
  UpdateEnrollmentDetailDto,
} from '../dto';

@Controller('enrollment-details')
export class EnrollmentDetailsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  create(@Body() createEnrollmentDetailDto: CreateEnrollmentDetailDto) {
    return this.enrollmentsService.createEnrollmentDetail(createEnrollmentDetailDto);
  }

  @Get()
  findAll(@Query() listEnrollmentDetailsDto: ListEnrollmentDetailsDto) {
    return this.enrollmentsService.findEnrollmentDetails(listEnrollmentDetailsDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findEnrollmentDetailById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEnrollmentDetailDto: UpdateEnrollmentDetailDto,
  ) {
    return this.enrollmentsService.updateEnrollmentDetail(
      id,
      updateEnrollmentDetailDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollmentsService.removeEnrollmentDetail(id);
  }
}
