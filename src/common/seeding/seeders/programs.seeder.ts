import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { NATS_SERVICE } from '../../../config';
import { ISeeder, SeederResult, SeedingContext } from '../interfaces/seeder.interface';
import { ProgramsFixture } from '../fixtures/programs.fixture';
import { AuthSeeder } from './auth.seeder';

@Injectable()
export class ProgramsSeeder implements ISeeder {
  private readonly logger = new Logger(ProgramsSeeder.name);

  readonly name = 'programs';
  readonly order = 2;
  readonly dependencies = ['auth'];

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    private readonly authSeeder: AuthSeeder,
  ) {}

  async seed(context: SeedingContext): Promise<SeederResult> {
    const startTime = Date.now();
    let recordsCreated = 0;
    const errors: string[] = [];

    try {
      // Step 1: Create Degree Programs
      this.logger.log('Creating degree programs...');
      const degreePrograms = ProgramsFixture.getDegreePrograms();
      const degreeProgramIds = new Map<string, string>();

      for (const degreeProgram of degreePrograms) {
        const programId = await this.createDegreeProgram(degreeProgram);
        if (programId) {
          degreeProgramIds.set(degreeProgram.code, programId);
          context.ids.programs.set(degreeProgram.code, programId);
          recordsCreated++;
          this.logger.debug(`Degree program created: ${degreeProgram.name} (${programId})`);
        }
      }

      // Step 2: Create Study Plans
      this.logger.log('Creating study plans...');
      const studyPlans = ProgramsFixture.getStudyPlans(degreeProgramIds);
      const studyPlanIds = new Map<string, string>();

      for (const studyPlan of studyPlans) {
        const studyPlanId = await this.createStudyPlan(studyPlan);
        if (studyPlanId) {
          const programCode = Array.from(degreeProgramIds.entries())
            .find(([_, id]) => id === studyPlan.degree_program_id)?.[0];
          if (programCode) {
            studyPlanIds.set(programCode, studyPlanId);
          }
          recordsCreated++;
          this.logger.debug(`Study plan created for version ${studyPlan.version}`);
        }
      }

      // Step 3: Create 10 Levels
      this.logger.log('Creating levels...');
      const levelIds = new Map<number, string>();
      
      for (let i = 1; i <= 10; i++) {
        const levelId = await this.createLevel({
          name: `Semestre ${i}`,
          order: i,
        });
        
        if (levelId) {
          levelIds.set(i, levelId);
          recordsCreated++;
        } else {
          errors.push(`Could not create level ${i}`);
        }
      }

      if (levelIds.size === 0) {
        errors.push('Could not create any levels for courses');
        return {
          seeder: this.name,
          success: false,
          recordsCreated,
          duration: Date.now() - startTime,
          errors,
        };
      }

      // Step 4: Create Courses for study plan
      this.logger.log('Creating courses...');
      const studyPlanForCourses = studyPlanIds.values().next().value;
      if (studyPlanForCourses) {
        const courses = ProgramsFixture.getCourses(studyPlanForCourses, levelIds);
        
        // Initialize coursesByLevel map
        for (let i = 1; i <= 10; i++) {
          context.ids.coursesByLevel.set(i, []);
        }
        
        for (const course of courses) {
          const courseId = await this.createCourse(course);
          if (courseId) {
            context.ids.courses.set(course.code, courseId);
            recordsCreated++;
            
            // Find which level this course belongs to and add to coursesByLevel
            for (let i = 1; i <= 10; i++) {
              const levelId = levelIds.get(i);
              if (levelId === course.level_id) {
                const levelCourses = context.ids.coursesByLevel.get(i) || [];
                levelCourses.push(courseId);
                context.ids.coursesByLevel.set(i, levelCourses);
                break;
              }
            }
          }
        }
      }

      // Step 5: Create Prerequisites
      this.logger.log('Creating prerequisites...');
      const prerequisites = ProgramsFixture.getPrerequisites();
      
      for (const prereq of prerequisites) {
        const mainCourseId = context.ids.courses.get(prereq.course_code);
        const requiredCourseId = context.ids.courses.get(prereq.prerequisite_code);
        
        if (mainCourseId && requiredCourseId) {
          const prereqCreated = await this.createPrerequisite({
            main_course_id: mainCourseId,
            required_course_id: requiredCourseId,
            kind: 'required',
          });
          
          if (prereqCreated) {
            recordsCreated++;
          }
        } else {
          if (!mainCourseId) {
            this.logger.warn(`Course not found for prerequisite: ${prereq.course_code}`);
          }
          if (!requiredCourseId) {
            this.logger.warn(`Required course not found: ${prereq.prerequisite_code}`);
          }
        }
      }

      // Step 6: Create Students with the study plan
      const studyPlanForStudents = studyPlanIds.values().next().value;
      if (studyPlanForStudents) {
        this.logger.log('Creating students with study plan...');
        const studentsCreated = await this.authSeeder.createStudents(context, studyPlanForStudents);
        recordsCreated += studentsCreated;
      }

    } catch (error) {
      errors.push(`Programs seeder error: ${error.message}`);
      this.logger.error(`Error in programs seeder: ${error.message}`, error.stack);
    }

    return {
      seeder: this.name,
      success: errors.length === 0 && recordsCreated > 0,
      recordsCreated,
      duration: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing programs test data...');
    try {
      const response = await firstValueFrom(
        this.client.send('programs.clearTestData', {}).pipe(
          timeout(15000),
          catchError((error) => {
            this.logger.error(`Error calling programs.clearTestData: ${error.message}`);
            throw error;
          }),
        ),
      );
      this.logger.log(`Programs test data cleared successfully: ${JSON.stringify(response)}`);
    } catch (error) {
      this.logger.error(`Failed to clear programs data: ${error.message}`);
      throw error;
    }
  }

  private async createDegreeProgram(data: any): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.client.send('programs.degreePrograms.create', data).pipe(
          timeout(10000),
          catchError((err) => {
            if (err.message?.includes('already exists')) {
              return of({ alreadyExists: true });
            }
            throw err;
          }),
        ),
      );

      if (response?.alreadyExists) {
        return null;
      }

      return response?.id || null;
    } catch (error) {
      this.logger.error(`Error creating degree program ${data.code}: ${error.message}`);
      return null;
    }
  }

  private async createStudyPlan(data: any): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.client.send('programs.studyPlans.create', data).pipe(
          timeout(10000),
          catchError((err) => {
            if (err.message?.includes('already exists')) {
              return of({ alreadyExists: true });
            }
            throw err;
          }),
        ),
      );

      if (response?.alreadyExists) {
        return null;
      }

      return response?.id || null;
    } catch (error) {
      this.logger.error(`Error creating study plan: ${error.message}`);
      return null;
    }
  }

  private async createLevel(data: any): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.client.send('programs.levels.create', data).pipe(
          timeout(10000),
          catchError((err) => {
            if (err.message?.includes('already exists')) {
              return of({ alreadyExists: true });
            }
            throw err;
          }),
        ),
      );

      if (response?.alreadyExists) {
        try {
          const existing = await firstValueFrom(
            this.client.send('programs.levels.findByName', { name: data.name }).pipe(timeout(5000)),
          );
          return existing?.id || null;
        } catch {
          return null;
        }
      }

      return response?.id || null;
    } catch (error) {
      this.logger.error(`Error creating level: ${error.message}`);
      return null;
    }
  }

  private async createCourse(data: any): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.client.send('programs.courses.create', data).pipe(
          timeout(10000),
          catchError((err) => {
            if (err.message?.includes('already exists')) {
              return of({ alreadyExists: true });
            }
            throw err;
          }),
        ),
      );

      if (response?.alreadyExists) {
        return null;
      }

      return response?.id || null;
    } catch (error) {
      this.logger.error(`Error creating course ${data.code}: ${error.message}`);
      return null;
    }
  }

  private async createPrerequisite(data: any): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.client.send('programs.prerequisites.create', data).pipe(
          timeout(10000),
          catchError((err) => {
            if (err.message?.includes('already exists')) {
              return of({ alreadyExists: true });
            }
            throw err;
          }),
        ),
      );

      if (response?.alreadyExists) {
        return false;
      }

      return !!response?.id;
    } catch (error) {
      this.logger.error(`Error creating prerequisite: ${error.message}`);
      return false;
    }
  }
}
