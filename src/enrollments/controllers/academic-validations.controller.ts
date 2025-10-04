import { Controller, Get, Query } from '@nestjs/common';
import { EnrollmentsService } from '../services/enrollments.service';

@Controller('academic-validations')
export class AcademicValidationsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get('prerequisites/check')
  checkPrerequisites(
    @Query('studentId') studentId: string,
    @Query('courseId') courseId: string,
  ) {
    return this.enrollmentsService.checkPrerequisites(studentId, courseId);
  }

  @Get('enrollment/validate')
  validateEnrollment(
    @Query('studentId') studentId: string,
    @Query('courseSectionId') courseSectionId: string,
    @Query('termId') termId: string,
  ) {
    return this.enrollmentsService.validateEnrollmentEligibility(
      studentId,
      courseSectionId,
      termId,
    );
  }
}
