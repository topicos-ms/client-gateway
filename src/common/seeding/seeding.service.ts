import { Injectable, Logger } from '@nestjs/common';
import { ISeeder, SeedingContext, SeederProgress } from './interfaces/seeder.interface';
import { AuthSeeder } from './seeders/auth.seeder';
import { ProgramsSeeder } from './seeders/programs.seeder';
import { CalendarSeeder } from './seeders/calendar.seeder';
import { CourseSectionsSeeder } from './seeders/course-sections.seeder';
import { SchedulesSeeder } from './seeders/schedules.seeder';
import { EnrollmentsSeeder } from './seeders/enrollments.seeder';
import { EnrollmentDetailsSeeder } from './seeders/enrollment-details.seeder';
import { GradesSeeder } from './seeders/grades.seeder';

@Injectable()
export class SeedingService {
  private readonly logger = new Logger(SeedingService.name);
  private seeders: ISeeder[];

  constructor(
    private readonly authSeeder: AuthSeeder,
    private readonly programsSeeder: ProgramsSeeder,
    private readonly calendarSeeder: CalendarSeeder,
    private readonly courseSectionsSeeder: CourseSectionsSeeder,
    private readonly schedulesSeeder: SchedulesSeeder,
    private readonly enrollmentsSeeder: EnrollmentsSeeder,
    private readonly enrollmentDetailsSeeder: EnrollmentDetailsSeeder,
    private readonly gradesSeeder: GradesSeeder,
  ) {
    this.seeders = [
      authSeeder,
      programsSeeder,
      calendarSeeder,
      courseSectionsSeeder,
      schedulesSeeder,
      enrollmentsSeeder,
      enrollmentDetailsSeeder,
      gradesSeeder,
    ].sort((a, b) => a.order - b.order);
  }

  async seedAll(clearBefore = false): Promise<SeederProgress> {
    this.logger.log('Starting database seeding...');

    const context: SeedingContext = {
      ids: {
        users: new Map(),
        programs: new Map(),
        courses: new Map(),
        coursesByLevel: new Map(),
        academicYears: new Map(),
        terms: new Map(),
        classrooms: new Map(),
        enrollments: new Map(),
      },
      getUserId: (email: string) => context.ids.users.get(email),
      getProgramId: (code: string) => context.ids.programs.get(code),
      getCourseId: (code: string) => context.ids.courses.get(code),
      getCoursesByLevel: (level: number) => context.ids.coursesByLevel.get(level),
      getAcademicYearId: (code: string) => context.ids.academicYears.get(code),
      getTermId: (code: string) => context.ids.terms.get(code),
      getClassroomId: (code: string) => context.ids.classrooms.get(code),
    };

    const progress: SeederProgress = {
      currentSeeder: '',
      completedSeeders: [],
      totalSeeders: this.seeders.length,
      progress: 0,
      results: [],
    };

    try {
      if (clearBefore) {
        await this.clearAllData();
      }

      for (const seeder of this.seeders) {
        this.logger.log(`Running seeder: ${seeder.name}`);
        progress.currentSeeder = seeder.name;

        const result = await seeder.seed(context);

        progress.results.push(result);
        progress.completedSeeders.push(seeder.name);
        progress.progress = Math.round(
          (progress.completedSeeders.length / progress.totalSeeders) * 100,
        );

        // Log context state after each seeder
        this.logger.log(
          `After ${seeder.name}: Context has ${context.ids.users.size} users`,
        );

        if (result.success) {
          this.logger.log(
            `Seeder ${seeder.name} completed: ${result.recordsCreated} records in ${result.duration}ms`,
          );
        } else {
          this.logger.warn(
            `Seeder ${seeder.name} completed with errors: ${result.errors?.join(', ')}`,
          );
        }
      }

      this.logger.log(
        `Database seeding completed! IDs cached: Users=${context.ids.users.size}, Programs=${context.ids.programs.size}, Courses=${context.ids.courses.size}`,
      );
    } catch (error) {
      this.logger.error(`Seeding failed: ${error.message}`, error.stack);
      throw error;
    }

    return progress;
  }

  async clearAllData(): Promise<void> {
    this.logger.log('Clearing all test data...');

    // Clear in reverse order to respect foreign key dependencies
    for (const seeder of [...this.seeders].reverse()) {
      try {
        this.logger.log(`Clearing ${seeder.name}...`);
        await seeder.clear();
        this.logger.log(`Cleared data from ${seeder.name}`);
      } catch (error) {
        this.logger.error(`Error clearing ${seeder.name}: ${error.message}`);
        throw error; // Stop if clearing fails
      }
    }
    
    this.logger.log('All test data cleared successfully');
  }
}
