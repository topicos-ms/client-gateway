export interface GradeSeedData {
  course_section_id: string;
  student_id: string;
  final_grade?: number;
}

export class GradesFixture {
  /**
   * Creates grades for a student in multiple course sections
   */
  static createGradesForStudent(
    studentId: string,
    courseSectionIds: string[],
    finalGrade?: number,
  ): GradeSeedData[] {
    return courseSectionIds.map((courseSectionId) => ({
      course_section_id: courseSectionId,
      student_id: studentId,
      final_grade: finalGrade,
    }));
  }

  /**
   * Creates a single grade
   */
  static createGrade(
    courseSectionId: string,
    studentId: string,
    finalGrade?: number,
  ): GradeSeedData {
    return {
      course_section_id: courseSectionId,
      student_id: studentId,
      final_grade: finalGrade,
    };
  }
}
