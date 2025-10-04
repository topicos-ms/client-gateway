import { Controller, Get, Query } from '@nestjs/common';
import { EnrollmentsService } from '../services/enrollments.service';

@Controller('database-performance')
export class DatabasePerformanceController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get('prerequisites')
  getPrerequisites(@Query('courseId') courseId: string) {
    return this.enrollmentsService.getPrerequisitesPerformance(courseId);
  }

  @Get('approved-courses')
  getApprovedCourses(
    @Query('studentId') studentId: string,
    @Query('courseIds') courseIds: string,
  ) {
    return this.enrollmentsService.getApprovedCoursesPerformance(
      studentId,
      courseIds,
    );
  }

  @Get('schedules')
  getSchedules(@Query('courseSectionIds') courseSectionIds: string) {
    return this.enrollmentsService.getSchedulesPerformance(courseSectionIds);
  }

  @Get('enrollment-count')
  getEnrollmentCount(
    @Query('studentId') studentId: string,
    @Query('termId') termId: string,
  ) {
    return this.enrollmentsService.getEnrollmentCountPerformance(studentId, termId);
  }

  @Get('batch-prerequisites')
  getBatchPrerequisites(
    @Query('studentId') studentId: string,
    @Query('courseIds') courseIds: string,
  ) {
    return this.enrollmentsService.getBatchPrerequisitesPerformance(
      studentId,
      courseIds,
    );
  }

  @Get('has-passed')
  hasPassed(
    @Query('studentId') studentId: string,
    @Query('courseId') courseId: string,
  ) {
    return this.enrollmentsService.getHasPassedPerformance(studentId, courseId);
  }

  @Get('student-enrollment-details')
  getStudentEnrollmentDetails(
    @Query('studentId') studentId: string,
    @Query('termId') termId: string,
  ) {
    return this.enrollmentsService.getStudentEnrollmentDetailsPerformance(
      studentId,
      termId,
    );
  }
}
