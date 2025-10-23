export interface DegreeProgramSeedData {
  name: string;
  code: string;
  degree_title: string;
  modality: string;
  status?: string;
}

export interface StudyPlanSeedData {
  degree_program_id: string;
  version: string;
  is_current: boolean;
  valid_from: Date;
  valid_to?: Date;
  resolution?: string;
}

export interface CourseSeedData {
  study_plan_id: string;
  level_id: string;
  code: string;
  name: string;
  credits: number;
  hours_theory: number;
  hours_practice: number;
  status?: string;
}

export interface PrerequisiteSeedData {
  course_code: string;
  prerequisite_code: string;
}

export class ProgramsFixture {
  static getDegreePrograms(): DegreeProgramSeedData[] {
    return [
      {
        name: 'Ingeniería en Sistemas',
        code: 'ISI',
        degree_title: 'Ingeniero en Sistemas',
        modality: 'Onsite',
        status: 'Active',
      },
    ];
  }

  static getStudyPlans(degreeProgramIds: Map<string, string>): StudyPlanSeedData[] {
    const plans: StudyPlanSeedData[] = [];
    
    // Ingeniería en Sistemas
    const isiId = degreeProgramIds.get('ISI');
    if (isiId) {
      plans.push({
        degree_program_id: isiId,
        version: '2024',
        is_current: true,
        valid_from: new Date('2024-01-01'),
        resolution: 'RES-2024-001',
      });
    }

    return plans;
  }

  static getCourses(studyPlanId: string, levelIds: Map<number, string>): CourseSeedData[] {
    const courses: CourseSeedData[] = [];

    // 1° SEMESTRE
    const level1 = levelIds.get(1);
    if (level1) {
      courses.push(
        { study_plan_id: studyPlanId, level_id: level1, code: 'UNI100', name: 'Inglés Técnico I', credits: 3, hours_theory: 40, hours_practice: 20, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level1, code: 'FIS100', name: 'Física I', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level1, code: 'INF110', name: 'Introducción a la Informática', credits: 3, hours_theory: 40, hours_practice: 40, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level1, code: 'INF119', name: 'Estructuras Discretas', credits: 4, hours_theory: 60, hours_practice: 20, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level1, code: 'MAT101', name: 'Cálculo I', credits: 4, hours_theory: 80, hours_practice: 20, status: 'Active' },
      );
    }

    // 2° SEMESTRE
    const level2 = levelIds.get(2);
    if (level2) {
      courses.push(
        { study_plan_id: studyPlanId, level_id: level2, code: 'UNI101', name: 'Inglés Técnico II', credits: 3, hours_theory: 40, hours_practice: 20, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level2, code: 'FIS102', name: 'Física II', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level2, code: 'INF120', name: 'Programación I', credits: 5, hours_theory: 60, hours_practice: 80, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level2, code: 'MAT103', name: 'Álgebra Lineal', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level2, code: 'MAT102', name: 'Cálculo II', credits: 4, hours_theory: 80, hours_practice: 20, status: 'Active' },
      );
    }

    // 3° SEMESTRE
    const level3 = levelIds.get(3);
    if (level3) {
      courses.push(
        { study_plan_id: studyPlanId, level_id: level3, code: 'ADM100', name: 'Administración', credits: 3, hours_theory: 60, hours_practice: 0, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level3, code: 'FISICAOO', name: 'Física III', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level3, code: 'INF211', name: 'Arquitectura de Computadoras', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level3, code: 'INF210', name: 'Programación II', credits: 5, hours_theory: 60, hours_practice: 80, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level3, code: 'MAT207', name: 'Ecuaciones Diferenciales', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
      );
    }

    // 4° SEMESTRE
    const level4 = levelIds.get(4);
    if (level4) {
      courses.push(
        { study_plan_id: studyPlanId, level_id: level4, code: 'ADM200', name: 'Contabilidad', credits: 3, hours_theory: 60, hours_practice: 0, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level4, code: 'INF221', name: 'Programación en Ensamblador', credits: 4, hours_theory: 40, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level4, code: 'INF220', name: 'Estructura de Datos I', credits: 5, hours_theory: 60, hours_practice: 80, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level4, code: 'MAT202', name: 'Probabilidades y Estadística', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level4, code: 'MAT205', name: 'Métodos Numéricos', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
      );
    }

    // 5° SEMESTRE
    const level5 = levelIds.get(5);
    if (level5) {
      courses.push(
        { study_plan_id: studyPlanId, level_id: level5, code: 'ELC101', name: 'Modelado y Simulación de Sistemas', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level5, code: 'INF318', name: 'Programación Lógica y Funcional', credits: 4, hours_theory: 40, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level5, code: 'INF310', name: 'Estructura de Datos II', credits: 5, hours_theory: 60, hours_practice: 80, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level5, code: 'INF319', name: 'Lenguajes Formales', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level5, code: 'INF312', name: 'Base de Datos I', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level5, code: 'MAT302', name: 'Probabilidades y Estadística II', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
      );
    }

    // 6° SEMESTRE
    const level6 = levelIds.get(6);
    if (level6) {
      courses.push(
        { study_plan_id: studyPlanId, level_id: level6, code: 'ELC104', name: 'Procesamiento Digital de Tiempo Real', credits: 4, hours_theory: 40, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level6, code: 'INF329', name: 'Compiladores', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level6, code: 'INF323', name: 'Sistemas Operativos I', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level6, code: 'INF322', name: 'Base de Datos II', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level6, code: 'INF342', name: 'Sistema de Información I', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level6, code: 'MAT329', name: 'Investigación Operativa', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
      );
    }

    // 7° SEMESTRE
    const level7 = levelIds.get(7);
    if (level7) {
      courses.push(
        { study_plan_id: studyPlanId, level_id: level7, code: 'ELC105', name: 'Sistemas Distribuidos', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level7, code: 'INF418', name: 'Inteligencia Artificial', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level7, code: 'INF433', name: 'Redes I', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level7, code: 'INF413', name: 'Sistemas Operativos II', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level7, code: 'INF412', name: 'Sistema de Información II', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level7, code: 'MAT419', name: 'Investigación Operativa II', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
      );
    }

    // 8° SEMESTRE
    const level8 = levelIds.get(8);
    if (level8) {
      courses.push(
        { study_plan_id: studyPlanId, level_id: level8, code: 'ELC107', name: 'Criptografía y Seguridad', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level8, code: 'INF423', name: 'Redes II', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level8, code: 'INF428', name: 'Sistemas Expertos', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level8, code: 'INF422', name: 'Ingeniería de Software I', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level8, code: 'INF442', name: 'Sistema de Información Geográfica', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level8, code: 'ECO449', name: 'Preparación y Evaluación de Proyectos', credits: 4, hours_theory: 60, hours_practice: 40, status: 'Active' },
      );
    }

    // 9° SEMESTRE
    const level9 = levelIds.get(9);
    if (level9) {
      courses.push(
        { study_plan_id: studyPlanId, level_id: level9, code: 'INF511', name: 'Taller de Grado I', credits: 6, hours_theory: 40, hours_practice: 120, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level9, code: 'INF512', name: 'Ingeniería de Software II', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level9, code: 'INF513', name: 'Tecnología Web', credits: 4, hours_theory: 40, hours_practice: 80, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level9, code: 'INF552', name: 'Arquitectura de Software II', credits: 4, hours_theory: 60, hours_practice: 60, status: 'Active' },
      );
    }

    // 10° SEMESTRE
    const level10 = levelIds.get(10);
    if (level10) {
      courses.push(
        { study_plan_id: studyPlanId, level_id: level10, code: 'GDI001', name: 'Graduación Directa', credits: 8, hours_theory: 0, hours_practice: 200, status: 'Active' },
        { study_plan_id: studyPlanId, level_id: level10, code: 'GRL001', name: 'Modalidad de Graduación', credits: 8, hours_theory: 0, hours_practice: 200, status: 'Active' },
      );
    }

    return courses;
  }

  static getPrerequisites(): PrerequisiteSeedData[] {
    return [
      // 2° SEMESTRE PREREQUISITES
      { course_code: 'UNI101', prerequisite_code: 'UNI100' },
      { course_code: 'FIS102', prerequisite_code: 'FIS100' },
      { course_code: 'INF120', prerequisite_code: 'INF110' },
      { course_code: 'MAT102', prerequisite_code: 'MAT101' },
      { course_code: 'MAT103', prerequisite_code: 'MAT101' },

      // 3° SEMESTRE PREREQUISITES
      { course_code: 'FISICAOO', prerequisite_code: 'FIS102' },
      { course_code: 'INF210', prerequisite_code: 'INF120' },
      { course_code: 'INF211', prerequisite_code: 'INF120' },
      { course_code: 'MAT207', prerequisite_code: 'MAT102' },

      // 4° SEMESTRE PREREQUISITES
      { course_code: 'INF220', prerequisite_code: 'INF210' },
      { course_code: 'INF220', prerequisite_code: 'INF119' },
      { course_code: 'INF221', prerequisite_code: 'INF211' },
      { course_code: 'MAT202', prerequisite_code: 'MAT103' },
      { course_code: 'MAT205', prerequisite_code: 'MAT102' },

      // 5° SEMESTRE PREREQUISITES
      { course_code: 'INF310', prerequisite_code: 'INF220' },
      { course_code: 'INF312', prerequisite_code: 'INF220' },
      { course_code: 'INF318', prerequisite_code: 'INF220' },
      { course_code: 'INF319', prerequisite_code: 'INF220' },
      { course_code: 'MAT302', prerequisite_code: 'MAT202' },

      // 6° SEMESTRE PREREQUISITES
      { course_code: 'INF322', prerequisite_code: 'INF312' },
      { course_code: 'INF323', prerequisite_code: 'INF310' },
      { course_code: 'INF329', prerequisite_code: 'INF319' },
      { course_code: 'INF342', prerequisite_code: 'INF312' },
      { course_code: 'MAT329', prerequisite_code: 'MAT302' },

      // 7° SEMESTRE PREREQUISITES
      { course_code: 'INF412', prerequisite_code: 'INF342' },
      { course_code: 'INF413', prerequisite_code: 'INF323' },
      { course_code: 'INF418', prerequisite_code: 'INF310' },
      { course_code: 'INF433', prerequisite_code: 'INF323' },
      { course_code: 'MAT419', prerequisite_code: 'MAT329' },

      // 8° SEMESTRE PREREQUISITES
      { course_code: 'INF422', prerequisite_code: 'INF412' },
      { course_code: 'INF423', prerequisite_code: 'INF433' },
      { course_code: 'INF428', prerequisite_code: 'INF418' },
      { course_code: 'INF442', prerequisite_code: 'INF322' },

      // 9° SEMESTRE PREREQUISITES
      { course_code: 'INF512', prerequisite_code: 'INF422' },
      { course_code: 'INF513', prerequisite_code: 'INF423' },
      { course_code: 'INF552', prerequisite_code: 'INF512' },

      // 10° SEMESTRE PREREQUISITES
      { course_code: 'GDI001', prerequisite_code: 'INF511' },
      { course_code: 'GRL001', prerequisite_code: 'INF511' },
    ];
  }
}
