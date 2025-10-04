import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from '../../config';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  ListEnrollmentsDto,
  CreateEnrollmentDetailDto,
  UpdateEnrollmentDetailDto,
  ListEnrollmentDetailsDto,
} from '../dto';

@Injectable()
export class EnrollmentsService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  // Enrollments
  createEnrollment(createEnrollmentDto: CreateEnrollmentDto) {
    return firstValueFrom(
      this.client.send('enrollments.create', createEnrollmentDto),
    );
  }

  findEnrollments(listEnrollmentsDto: ListEnrollmentsDto) {
    return firstValueFrom(
      this.client.send('enrollments.list', listEnrollmentsDto),
    );
  }

  findEnrollmentById(id: string) {
    return firstValueFrom(this.client.send('enrollments.findOne', id));
  }

  updateEnrollment(id: string, updateEnrollmentDto: UpdateEnrollmentDto) {
    return firstValueFrom(
      this.client.send('enrollments.update', {
        id,
        updateEnrollmentDto,
      }),
    );
  }

  removeEnrollment(id: string) {
    return firstValueFrom(this.client.send('enrollments.remove', id));
  }

  // Enrollment details
  createEnrollmentDetail(createEnrollmentDetailDto: CreateEnrollmentDetailDto) {
    return firstValueFrom(
      this.client.send('enrollment-details.create', createEnrollmentDetailDto),
    );
  }

  findEnrollmentDetails(listEnrollmentDetailsDto: ListEnrollmentDetailsDto) {
    return firstValueFrom(
      this.client.send('enrollment-details.list', listEnrollmentDetailsDto),
    );
  }

  findEnrollmentDetailById(id: string) {
    return firstValueFrom(this.client.send('enrollment-details.findOne', id));
  }

  updateEnrollmentDetail(
    id: string,
    updateEnrollmentDetailDto: UpdateEnrollmentDetailDto,
  ) {
    return firstValueFrom(
      this.client.send('enrollment-details.update', {
        id,
        updateEnrollmentDetailDto,
      }),
    );
  }

  removeEnrollmentDetail(id: string) {
    return firstValueFrom(this.client.send('enrollment-details.remove', id));
  }

  // Academic validations
  checkPrerequisites(studentId: string, courseId: string) {
    return firstValueFrom(
      this.client.send('enrollments.academic.checkPrerequisites', {
        studentId,
        courseId,
      }),
    );
  }

  validateEnrollmentEligibility(
    studentId: string,
    courseSectionId: string,
    termId: string,
  ) {
    return firstValueFrom(
      this.client.send('enrollments.academic.validateEnrollment', {
        studentId,
        courseSectionId,
        termId,
      }),
    );
  }

  // Atomic enrollment
  atomicEnroll(
    data: CreateEnrollmentDetailDto,
    idempotencyKey: string,
  ) {
    return firstValueFrom(
      this.client.send('enrollments.atomic.enroll', {
        data,
        idempotencyKey,
      }),
    );
  }

  getCourseSectionQuotaStatus(courseSectionId: string) {
    return firstValueFrom(
      this.client.send('enrollments.atomic.quotaStatus', { courseSectionId }),
    );
  }

  getIdempotencyStats() {
    return firstValueFrom(
      this.client.send('enrollments.atomic.idempotencyStats', {}),
    );
  }

  // Performance insights
  getPrerequisitesPerformance(courseId: string) {
    return firstValueFrom(
      this.client.send('enrollments.performance.prerequisites', { courseId }),
    );
  }

  getApprovedCoursesPerformance(studentId: string, courseIds: string[] | string) {
    return firstValueFrom(
      this.client.send('enrollments.performance.approvedCourses', {
        studentId,
        courseIds,
      }),
    );
  }

  getSchedulesPerformance(courseSectionIds: string[] | string) {
    return firstValueFrom(
      this.client.send('enrollments.performance.schedules', {
        courseSectionIds,
      }),
    );
  }

  getEnrollmentCountPerformance(studentId: string, termId: string) {
    return firstValueFrom(
      this.client.send('enrollments.performance.enrollmentCount', {
        studentId,
        termId,
      }),
    );
  }

  getBatchPrerequisitesPerformance(studentId: string, courseIds: string[] | string) {
    return firstValueFrom(
      this.client.send('enrollments.performance.batchPrerequisites', {
        studentId,
        courseIds,
      }),
    );
  }

  getHasPassedPerformance(studentId: string, courseId: string) {
    return firstValueFrom(
      this.client.send('enrollments.performance.hasPassed', {
        studentId,
        courseId,
      }),
    );
  }

  getStudentEnrollmentDetailsPerformance(studentId: string, termId: string) {
    return firstValueFrom(
      this.client.send('enrollments.performance.studentEnrollmentDetails', {
        studentId,
        termId,
      }),
    );
  }
}
