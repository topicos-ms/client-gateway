export interface EnrollmentDetailSeedData {
  enrollment_id?: string;
  student_code?: string;
  term_name?: string;
  course_section_id?: string;
  course_code?: string;
  group_label?: string;
  degree_program_code?: string;
  study_plan_version?: string;
  course_state?: string;
  final_grade?: number;
  attempts?: number;
  closed_on?: string;
  remark?: string;
}

export class EnrollmentDetailsFixture {
  /**
   * Creates enrollment details for a student's enrollment
   */
  static createEnrollmentDetails(
    enrollmentId: string,
    courseSectionIds: string[],
    courseState: string = 'Enrolled',
    finalGrade?: number,
  ): EnrollmentDetailSeedData[] {
    return courseSectionIds.map((courseSectionId) => ({
      enrollment_id: enrollmentId,
      course_section_id: courseSectionId,
      course_state: courseState,
      final_grade: finalGrade,
      attempts: 1,
      remark: 'Test enrollment detail created by seeder',
    }));
  }

  /**
   * Creates a single enrollment detail
   */
  static createEnrollmentDetail(
    enrollmentId: string,
    courseSectionId: string,
    courseState: string = 'Enrolled',
    finalGrade?: number,
    attempts: number = 1,
  ): EnrollmentDetailSeedData {
    return {
      enrollment_id: enrollmentId,
      course_section_id: courseSectionId,
      course_state: courseState,
      final_grade: finalGrade,
      attempts,
      remark: 'Test enrollment detail created by seeder',
    };
  }
}
