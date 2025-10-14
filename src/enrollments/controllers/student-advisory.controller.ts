import { Controller, Get, Query } from '@nestjs/common';
import { EnrollmentsService } from '../services/enrollments.service';

@Controller('students')
export class StudentAdvisoryController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get('recommended-courses')
  recommendedCourses(
    @Query('studentId') studentId?: string,
    @Query('studentCode') studentCode?: string,
  ) {
    return this.enrollmentsService.getRecommendedCourses({
      studentId,
      studentCode,
    });
  }
}

