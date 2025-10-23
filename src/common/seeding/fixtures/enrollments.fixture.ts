export interface EnrollmentSeedData {
  student_id?: string;
  student_code?: string;
  term_id?: string;
  term_name?: string;
  enrolled_on: string; // ISO date format
  state?: string;
  origin?: string;
  note?: string;
}

export class EnrollmentsFixture {
  /**
   * Creates enrollments for a specific student in given terms
   */
  static getEnrollmentsForStudent(
    studentId: string,
    termIds: string[],
    enrollmentDate: string = new Date().toISOString().split('T')[0],
  ): EnrollmentSeedData[] {
    return termIds.map((termId) => ({
      student_id: studentId,
      term_id: termId,
      enrolled_on: enrollmentDate,
      state: 'Active',
      origin: 'Regular',
      note: 'Test enrollment created by seeder',
    }));
  }

  /**
   * Creates a single enrollment
   */
  static createEnrollment(
    studentId: string,
    termId: string,
    enrollmentDate?: string,
    state: string = 'Active',
    origin: string = 'Regular',
  ): EnrollmentSeedData {
    return {
      student_id: studentId,
      term_id: termId,
      enrolled_on: enrollmentDate || new Date().toISOString().split('T')[0],
      state,
      origin,
      note: 'Test enrollment created by seeder',
    };
  }
}
