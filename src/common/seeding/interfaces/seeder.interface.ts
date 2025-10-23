/**
 * Interface base para todos los seeders
 */
export interface ISeeder {
  readonly name: string;
  readonly order: number;
  readonly dependencies: string[];

  seed(context: SeedingContext): Promise<SeederResult>;
  clear(): Promise<void>;
}

/**
 * Resultado de la ejecución de un seeder
 */
export interface SeederResult {
  seeder: string;
  success: boolean;
  recordsCreated: number;
  duration: number;
  errors?: string[];
}

/**
 * Progreso del seeding completo
 */
export interface SeederProgress {
  currentSeeder: string;
  completedSeeders: string[];
  totalSeeders: number;
  progress: number;
  results: SeederResult[];
}

/**
 * Contexto compartido entre seeders para almacenar UUIDs creados
 */
export interface SeedingContext {
  ids: {
    users: Map<string, string>;
    programs: Map<string, string>;
    courses: Map<string, string>;
    coursesByLevel: Map<number, string[]>;
    academicYears: Map<string, string>;
    terms: Map<string, string>;
    classrooms: Map<string, string>;
    enrollments: Map<string, string>;
  };

  getUserId(email: string): string | undefined;
  getProgramId(code: string): string | undefined;
  getCourseId(code: string): string | undefined;
  getCoursesByLevel(level: number): string[] | undefined;
  getAcademicYearId(code: string): string | undefined;
  getTermId(code: string): string | undefined;
  getClassroomId(code: string): string | undefined;
}
