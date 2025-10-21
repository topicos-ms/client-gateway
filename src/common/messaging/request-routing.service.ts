import { Injectable, Logger } from '@nestjs/common';
import { JobData, JobMessageMetadata } from '../interceptors/interfaces/job-data.interface';

export interface RouteResolution {
  message: JobMessageMetadata;
  payload: any;
}

interface RouteConfig {
  method: string;
  path: string;
  pattern: string;
  completionEvent?: string;
  buildPayload: (job: JobData) => any;
}

@Injectable()
export class RequestRoutingService {
  private readonly logger = new Logger(RequestRoutingService.name);

  private readonly routes: RouteConfig[] = [
    // ===== Enrollments =====
    ...this.buildEnrollmentRoutes(),
    // ===== Programs =====
    { method: 'POST', path: '/degree-programs', pattern: 'programs.degreePrograms.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/degree-programs', pattern: 'programs.degreePrograms.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/degree-programs/:id', pattern: 'programs.degreePrograms.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/degree-programs/:id',
      pattern: 'programs.degreePrograms.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateDegreeProgramDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/degree-programs/:id', pattern: 'programs.degreePrograms.remove', buildPayload: (job) => this.requireParam(job, 'id') },
    { method: 'POST', path: '/study-plans', pattern: 'programs.studyPlans.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/study-plans', pattern: 'programs.studyPlans.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/study-plans/:id', pattern: 'programs.studyPlans.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/study-plans/:id',
      pattern: 'programs.studyPlans.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateStudyPlanDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/study-plans/:id', pattern: 'programs.studyPlans.remove', buildPayload: (job) => this.requireParam(job, 'id') },
    { method: 'POST', path: '/levels', pattern: 'programs.levels.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/levels', pattern: 'programs.levels.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/levels/:id', pattern: 'programs.levels.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/levels/:id',
      pattern: 'programs.levels.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateLevelDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/levels/:id', pattern: 'programs.levels.remove', buildPayload: (job) => this.requireParam(job, 'id') },
    { method: 'POST', path: '/courses', pattern: 'programs.courses.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/courses', pattern: 'programs.courses.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/courses/:id', pattern: 'programs.courses.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/courses/:id',
      pattern: 'programs.courses.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateCourseDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/courses/:id', pattern: 'programs.courses.remove', buildPayload: (job) => this.requireParam(job, 'id') },
    { method: 'POST', path: '/prerequisites', pattern: 'programs.prerequisites.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/prerequisites', pattern: 'programs.prerequisites.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/prerequisites/:id', pattern: 'programs.prerequisites.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/prerequisites/:id',
      pattern: 'programs.prerequisites.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updatePrerequisiteDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/prerequisites/:id', pattern: 'programs.prerequisites.remove', buildPayload: (job) => this.requireParam(job, 'id') },

    // ===== Calendar =====
    { method: 'POST', path: '/academic-years', pattern: 'calendar.academicYears.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/academic-years', pattern: 'calendar.academicYears.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/academic-years/:id', pattern: 'calendar.academicYears.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/academic-years/:id',
      pattern: 'calendar.academicYears.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateAcademicYearDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/academic-years/:id', pattern: 'calendar.academicYears.remove', buildPayload: (job) => this.requireParam(job, 'id') },
    { method: 'POST', path: '/terms', pattern: 'calendar.terms.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/terms', pattern: 'calendar.terms.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/terms/:id', pattern: 'calendar.terms.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/terms/:id',
      pattern: 'calendar.terms.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateTermDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/terms/:id', pattern: 'calendar.terms.remove', buildPayload: (job) => this.requireParam(job, 'id') },
    { method: 'POST', path: '/calendar/managements', pattern: 'calendar.academicYears.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/calendar/managements', pattern: 'calendar.academicYears.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/calendar/managements/:id', pattern: 'calendar.academicYears.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/calendar/managements/:id',
      pattern: 'calendar.academicYears.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateAcademicYearDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/calendar/managements/:id', pattern: 'calendar.academicYears.remove', buildPayload: (job) => this.requireParam(job, 'id') },
    { method: 'POST', path: '/calendar/periods', pattern: 'calendar.terms.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/calendar/periods', pattern: 'calendar.terms.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/calendar/periods/:id', pattern: 'calendar.terms.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/calendar/periods/:id',
      pattern: 'calendar.terms.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateTermDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/calendar/periods/:id', pattern: 'calendar.terms.remove', buildPayload: (job) => this.requireParam(job, 'id') },
    // ===== Facilities =====
    { method: 'POST', path: '/classrooms', pattern: 'facilities.classrooms.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/classrooms', pattern: 'facilities.classrooms.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/classrooms/:id', pattern: 'facilities.classrooms.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/classrooms/:id',
      pattern: 'facilities.classrooms.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateClassroomDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/classrooms/:id', pattern: 'facilities.classrooms.remove', buildPayload: (job) => this.requireParam(job, 'id') },

    // ===== Teaching =====
    { method: 'POST', path: '/course-sections', pattern: 'teaching.courseSections.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/course-sections', pattern: 'teaching.courseSections.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/course-sections/:id', pattern: 'teaching.courseSections.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/course-sections/:id',
      pattern: 'teaching.courseSections.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateCourseSectionDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/course-sections/:id', pattern: 'teaching.courseSections.remove', buildPayload: (job) => this.requireParam(job, 'id') },
    { method: 'POST', path: '/schedules', pattern: 'teaching.schedules.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/schedules', pattern: 'teaching.schedules.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/schedules/:id', pattern: 'teaching.schedules.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/schedules/:id',
      pattern: 'teaching.schedules.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateScheduleDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/schedules/:id', pattern: 'teaching.schedules.remove', buildPayload: (job) => this.requireParam(job, 'id') },

    // ===== Assessments =====
    { method: 'POST', path: '/grades', pattern: 'grades.create', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/grades', pattern: 'grades.list', buildPayload: (job) => job.queryParams ?? {} },
    { method: 'GET', path: '/grades/:id', pattern: 'grades.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
    {
      method: 'PATCH',
      path: '/grades/:id',
      pattern: 'grades.update',
      buildPayload: (job) => ({
        id: this.requireParam(job, 'id'),
        updateGradeDto: job.data ?? {},
      }),
    },
    { method: 'DELETE', path: '/grades/:id', pattern: 'grades.remove', buildPayload: (job) => this.requireParam(job, 'id') },

    // ===== Auth =====
    { method: 'POST', path: '/auth/register', pattern: 'auth.register', buildPayload: (job) => job.data ?? {} },
    { method: 'POST', path: '/auth/login', pattern: 'auth.login', buildPayload: (job) => job.data ?? {} },
    { method: 'GET', path: '/auth/users', pattern: 'auth.get-users', buildPayload: () => ({}) },
    {
      method: 'PATCH',
      path: '/auth/update-user',
      pattern: 'auth.update-user',
      buildPayload: (job) => ({
        userId: this.requireUserId(job),
        updateUserDto: job.data ?? {},
      }),
    },
    {
      method: 'PUT',
      path: '/auth/change-password',
      pattern: 'auth.change-password',
      buildPayload: (job) => ({
        userId: this.requireUserId(job),
        changePasswordDto: job.data ?? {},
      }),
    },
    {
      method: 'POST',
      path: '/auth/logout',
      pattern: 'auth.logout',
      buildPayload: (job) => {
        const validation = this.requireAuthValidation(job);
        return {
          jti: validation.user?.jti ?? validation.user?.tokenId,
          exp: validation.user?.exp,
        };
      },
    },
    {
      method: 'POST',
      path: '/auth/logout-all',
      pattern: 'auth.logout-all',
      buildPayload: (job) => ({ userId: this.requireUserId(job) }),
    },
  ];

  private buildEnrollmentRoutes(): RouteConfig[] {
    return [
      { method: 'POST', path: '/enrollments', pattern: 'enrollments.create', buildPayload: (job) => job.data ?? {} },
      { method: 'GET', path: '/enrollments', pattern: 'enrollments.list', buildPayload: (job) => job.queryParams ?? {} },
      { method: 'GET', path: '/enrollments/:id', pattern: 'enrollments.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
      {
        method: 'PATCH',
        path: '/enrollments/:id',
        pattern: 'enrollments.update',
        buildPayload: (job) => ({ id: this.requireParam(job, 'id'), updateEnrollmentDto: job.data ?? {} }),
      },
      { method: 'DELETE', path: '/enrollments/:id', pattern: 'enrollments.remove', buildPayload: (job) => this.requireParam(job, 'id') },
      { method: 'POST', path: '/enrollment-details', pattern: 'enrollment-details.create', buildPayload: (job) => job.data ?? {} },
      { method: 'GET', path: '/enrollment-details', pattern: 'enrollment-details.list', buildPayload: (job) => job.queryParams ?? {} },
      { method: 'GET', path: '/enrollment-details/:id', pattern: 'enrollment-details.findOne', buildPayload: (job) => this.requireParam(job, 'id') },
      {
        method: 'PATCH',
        path: '/enrollment-details/:id',
        pattern: 'enrollment-details.update',
        buildPayload: (job) => ({ id: this.requireParam(job, 'id'), updateEnrollmentDetailDto: job.data ?? {} }),
      },
      { method: 'DELETE', path: '/enrollment-details/:id', pattern: 'enrollment-details.remove', buildPayload: (job) => this.requireParam(job, 'id') },
      {
        method: 'GET',
        path: '/academic-validations/prerequisites/check',
        pattern: 'enrollments.academic.checkPrerequisites',
        buildPayload: (job) => ({
          studentId: this.requireQuery(job, 'studentId'),
          courseId: this.requireQuery(job, 'courseId'),
        }),
      },
      {
        method: 'GET',
        path: '/academic-validations/enrollment/validate',
        pattern: 'enrollments.academic.validateEnrollment',
        buildPayload: (job) => ({
          studentId: this.requireQuery(job, 'studentId'),
          courseSectionId: this.requireQuery(job, 'courseSectionId'),
          termId: this.requireQuery(job, 'termId'),
        }),
      },
      {
        method: 'GET',
        path: '/students/recommended-courses',
        pattern: 'enrollments.students.recommendedCourses',
        buildPayload: (job) => {
          const studentIdRaw = job.queryParams?.studentId;
          const studentCodeRaw = job.queryParams?.studentCode;
          const studentId = Array.isArray(studentIdRaw) ? studentIdRaw[0] : studentIdRaw;
          const studentCode = Array.isArray(studentCodeRaw) ? studentCodeRaw[0] : studentCodeRaw;
          const normalizedStudentId = typeof studentId === 'string' && studentId.trim().length > 0 ? studentId.trim() : undefined;
          const normalizedStudentCode = typeof studentCode === 'string' && studentCode.trim().length > 0 ? studentCode.trim() : undefined;
          if (!normalizedStudentId && !normalizedStudentCode) {
            throw new Error('Provide studentId or studentCode');
          }
          return {
            studentId: normalizedStudentId,
            studentCode: normalizedStudentCode,
          };
        },
      },
      {
        method: 'POST',
        path: '/atomic-enrollment/enroll',
        pattern: 'enrollments.atomic.enroll',
        buildPayload: (job) => ({
          data: job.data ?? {},
          idempotencyKey: this.requireHeader(job, 'x-idempotency-key'),
        }),
      },
      {
        method: 'POST',
        path: '/atomic-enrollment/enroll/batch',
        pattern: 'enrollments.atomic.enrollBatch',
        buildPayload: (job) => ({
          data: job.data ?? {},
          idempotencyKey: this.requireHeader(job, 'x-idempotency-key'),
        }),
      },
      {
        method: 'GET',
        path: '/atomic-enrollment/course-section/:id/quota-status',
        pattern: 'enrollments.atomic.quotaStatus',
        buildPayload: (job) => ({ courseSectionId: this.requireParam(job, 'id') }),
      },
      { method: 'GET', path: '/atomic-enrollment/idempotency/stats', pattern: 'enrollments.atomic.idempotencyStats', buildPayload: () => ({}) },
      { method: 'GET', path: '/database-performance/prerequisites', pattern: 'enrollments.performance.prerequisites', buildPayload: (job) => ({ courseId: this.requireQuery(job, 'courseId') }) },
      {
        method: 'GET',
        path: '/database-performance/approved-courses',
        pattern: 'enrollments.performance.approvedCourses',
        buildPayload: (job) => ({
          studentId: this.requireQuery(job, 'studentId'),
          courseIds: this.requireQuery(job, 'courseIds'),
        }),
      },
      {
        method: 'GET',
        path: '/database-performance/schedules',
        pattern: 'enrollments.performance.schedules',
        buildPayload: (job) => ({ courseSectionIds: this.requireQuery(job, 'courseSectionIds') }),
      },
      {
        method: 'GET',
        path: '/database-performance/enrollment-count',
        pattern: 'enrollments.performance.enrollmentCount',
        buildPayload: (job) => ({
          studentId: this.requireQuery(job, 'studentId'),
          termId: this.requireQuery(job, 'termId'),
        }),
      },
      {
        method: 'GET',
        path: '/database-performance/batch-prerequisites',
        pattern: 'enrollments.performance.batchPrerequisites',
        buildPayload: (job) => ({
          studentId: this.requireQuery(job, 'studentId'),
          courseIds: this.requireQuery(job, 'courseIds'),
        }),
      },
      {
        method: 'GET',
        path: '/database-performance/has-passed',
        pattern: 'enrollments.performance.hasPassed',
        buildPayload: (job) => ({
          studentId: this.requireQuery(job, 'studentId'),
          courseId: this.requireQuery(job, 'courseId'),
        }),
      },
      {
        method: 'GET',
        path: '/database-performance/student-enrollment-details',
        pattern: 'enrollments.performance.studentEnrollmentDetails',
        buildPayload: (job) => ({
          studentId: this.requireQuery(job, 'studentId'),
          termId: this.requireQuery(job, 'termId'),
        }),
      },
    ];
  }

  resolve(job: JobData): RouteResolution | null {
    const method = job.method.toUpperCase();
    const path = this.normalizePath(job.url);

    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }

      if (!this.matchPath(route.path, path)) {
        continue;
      }

      try {
        const payload = route.buildPayload(job);
        if (payload === undefined) {
          this.logger.warn(`Route '${method} ${path}' matched but payload builder returned undefined`);
          return null;
        }

        const message: JobMessageMetadata = {
          pattern: route.pattern,
          completionEvent: route.completionEvent ?? `${route.pattern}.completed`,
        };

        return { message, payload };
      } catch (error: any) {
        this.logger.error(`Failed to build payload for route '${method} ${path}': ${error.message}`);
        return null;
      }
    }

    this.logger.warn(`No async routing rule registered for '${method} ${path}'`);
    return null;
  }

  private normalizePath(url: string): string {
    const index = url.indexOf('?');
    const purePath = index >= 0 ? url.substring(0, index) : url;
    if (!purePath.startsWith('/')) {
      return `/${purePath}`;
    }
    return purePath.replace(/\/+$/, '') || '/';
  }

  private matchPath(template: string, actual: string): boolean {
    if (template === actual) {
      return true;
    }

    const templateSegments = template.split('/').filter(Boolean);
    const actualSegments = actual.split('/').filter(Boolean);

    if (templateSegments.length !== actualSegments.length) {
      return false;
    }

    for (let i = 0; i < templateSegments.length; i++) {
      const templateSegment = templateSegments[i];
      const actualSegment = actualSegments[i];

      if (templateSegment.startsWith(':')) {
        continue;
      }

      if (templateSegment === '*') {
        continue;
      }

      if (templateSegment !== actualSegment) {
        return false;
      }
    }

    return true;
  }

  private requireParam(job: JobData, param: string): string {
    const value = job.params?.[param];
    if (!value) {
      throw new Error(`Missing route param '${param}'`);
    }
    return value;
  }

  private requireQuery(job: JobData, key: string): string {
    const value = job.queryParams?.[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing query parameter '${key}'`);
    }
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private requireHeader(job: JobData, header: string): string {
    const value = job.headers[header];
    if (!value) {
      throw new Error(`Missing header '${header}'`);
    }
    return value;
  }

  private requireUserId(job: JobData): string {
    if (job.userId) {
      return job.userId;
    }
    const validation = job.context?.authValidation;
    const userId = validation?.user?.sub || validation?.user?.id;
    if (!userId) {
      throw new Error('Missing user identifier for auth-protected route');
    }
    return userId;
  }

  private requireAuthValidation(job: JobData): any {
    const validation = job.context?.authValidation;
    if (!validation) {
      throw new Error('Missing auth validation context');
    }
    return validation;
  }
}
