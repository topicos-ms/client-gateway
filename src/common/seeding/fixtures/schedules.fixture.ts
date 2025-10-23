export interface ScheduleSeedData {
  course_section_id: string;
  weekday: string;
  time_start: string;
  time_end: string;
  classroom_id?: string;
}

export class SchedulesFixture {
  /**
   * Genera horarios para una sección de curso
   * @param courseSectionId - ID de la sección de curso
   * @param classroomId - ID del aula (opcional)
   * @param schedulePattern - Patrón de horario: 'morning' | 'afternoon' | 'night'
   * @returns Array de horarios
   */
  static getSchedulesForSection(
    courseSectionId: string,
    classroomId?: string,
    schedulePattern: 'morning' | 'afternoon' | 'night' = 'morning',
  ): ScheduleSeedData[] {
    const schedules: ScheduleSeedData[] = [];

    // Definir patrones de horario
    const timePatterns = {
      morning: [
        { weekday: 'Monday', time_start: '08:00', time_end: '10:00' },
        { weekday: 'Wednesday', time_start: '08:00', time_end: '10:00' },
      ],
      afternoon: [
        { weekday: 'Tuesday', time_start: '14:00', time_end: '16:00' },
        { weekday: 'Thursday', time_start: '14:00', time_end: '16:00' },
      ],
      night: [
        { weekday: 'Monday', time_start: '18:00', time_end: '20:00' },
        { weekday: 'Friday', time_start: '18:00', time_end: '20:00' },
      ],
    };

    const pattern = timePatterns[schedulePattern];

    for (const slot of pattern) {
      schedules.push({
        course_section_id: courseSectionId,
        weekday: slot.weekday,
        time_start: slot.time_start,
        time_end: slot.time_end,
        classroom_id: classroomId,
      });
    }

    return schedules;
  }

  /**
   * Genera horarios variados para múltiples secciones
   * Alterna entre mañana, tarde y noche
   */
  static getSchedulesForMultipleSections(
    courseSectionIds: string[],
    classroomIds: string[] = [],
  ): ScheduleSeedData[] {
    const schedules: ScheduleSeedData[] = [];
    const patterns: Array<'morning' | 'afternoon' | 'night'> = ['morning', 'afternoon', 'night'];

    courseSectionIds.forEach((sectionId, index) => {
      const pattern = patterns[index % patterns.length];
      const classroomId = classroomIds.length > 0 ? classroomIds[index % classroomIds.length] : undefined;

      const sectionSchedules = this.getSchedulesForSection(sectionId, classroomId, pattern);
      schedules.push(...sectionSchedules);
    });

    return schedules;
  }
}
