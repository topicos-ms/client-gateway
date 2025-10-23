import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { ISeeder, SeedingContext, SeederResult } from '../interfaces/seeder.interface';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from '../../../config';

@Injectable()
export class CourseSectionsSeeder implements ISeeder {
  readonly name = 'course-sections.seeder';
  readonly order = 60; // run after auth, programs, calendar
  readonly dependencies = ['auth.seeder', 'programs.seeder', 'calendar.seeder'];

  private readonly logger = new Logger(CourseSectionsSeeder.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async clear(): Promise<void> {
    // teaching-ms doesn't expose a bulk clear endpoint; attempt to call remove by query if exists
    try {
      await firstValueFrom(this.client.send('teaching.courseSections.clearTestData', {}).pipe(timeout(10000)));
      this.logger.log('teaching.courseSections cleared via clearTestData');
    } catch (err) {
      // If the microservice doesn't implement clear, ignore
      this.logger.log('teaching.courseSections.clearTestData not available or failed — skipping clear');
    }
  }

  async seed(context: SeedingContext): Promise<SeederResult> {
    const start = Date.now();
    const errors: string[] = [];
    let created = 0;

    // Terms names expected from calendar fixture (matching the actual term names created)
    // Calendar creates terms with names like "Primer Semestre", "Segundo Semestre" (without year)
    // We need to find the specific term IDs by matching name + start_date
    const termsConfig = [
      { termName: 'Primer Semestre', startDate: '2024-02-01', level: 1 },   // Semestre 1
      { termName: 'Segundo Semestre', startDate: '2024-08-01', level: 2 },  // Semestre 2
      { termName: 'Primer Semestre', startDate: '2025-02-01', level: 3 },   // Semestre 3 (active)
    ];

    // Try to get teachers from context first
    let teacherIds = Array.from(context.ids.users.values()).filter((id) => !!id);
    
    // If no teachers in context, use hardcoded teacher emails from fixture
    // These are the teachers created during seeding with known emails
    if (teacherIds.length === 0) {
      this.logger.warn('No teachers found in context, will try to find by email...');
      const teacherEmails = [
        'docente1@uagrm.edu.bo',
        'docente2@uagrm.edu.bo',
        'docente3@uagrm.edu.bo',
        'docente4@uagrm.edu.bo',
        'docente5@uagrm.edu.bo',
      ];
      
      for (const email of teacherEmails) {
        try {
          const response = await firstValueFrom(
            this.client.send('auth.findByEmail', { email }).pipe(
              timeout(5000),
              catchError(() => of(null))
            )
          );
          
          if (response?.id) {
            teacherIds.push(response.id);
          }
        } catch (err) {
          // Skip if teacher not found
        }
      }
      
      if (teacherIds.length > 0) {
        this.logger.log(`Found ${teacherIds.length} teachers by email`);
      }
    }

    // If still no teachers, log warning
    if (teacherIds.length === 0) {
      this.logger.warn('Still no teachers found, course sections will not have teachers assigned');
    }

    const classroomIds = Array.from(context.ids.classrooms.values()).filter((id) => !!id);

    if (classroomIds.length === 0) {
      errors.push('No classrooms found in context.ids.classrooms');
      this.logger.warn('No classrooms found in context');
    }

    try {
      for (const { termName, startDate, level } of termsConfig) {
        // Find the term ID using the composite key
        const termKey = `${termName}|${startDate}`;
        const termId = context.ids.terms.get(termKey);

        if (!termId) {
          const errorMsg = `Term not found: ${termName} starting ${startDate}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
          continue;
        }

        // Get courses for this level
        const courseIds = context.getCoursesByLevel(level) || [];

        if (courseIds.length === 0) {
          this.logger.warn(`No courses found for level ${level}`);
          continue;
        }

        this.logger.log(`Creating ${courseIds.length} course sections for ${termName} ${startDate} (Level ${level})`);

        // Create a section per course
        let teacherIdx = 0;
        let classroomIdx = 0;

        for (const courseId of courseIds) {
          // Use teacher email to let teaching-ms resolve the teacher_id
          // This way teaching-ms will query the database directly
          const teacherEmail = teacherIds.length > 0 ? undefined : 'docente1@uagrm.edu.bo';
          
          const payload: any = {
            course_id: courseId,
            term_id: termId,
            group_label: `G${level}`,
            modality: 'Onsite',
            shift: 'Morning',
            quota_max: 30,
            quota_available: 30,
            classroom_id: classroomIds.length > 0 ? classroomIds[classroomIdx % classroomIds.length] : undefined,
            status: 'Active',
          };
          
          // Add teacher - either by ID or by email
          if (teacherIds.length > 0) {
            payload.teacher_id = teacherIds[teacherIdx % teacherIds.length];
          } else if (teacherEmail) {
            payload.teacher_email = teacherEmail;
          }

          try {
            await firstValueFrom(this.client.send('teaching.courseSections.create', payload).pipe(timeout(10000)));
            created += 1;
            this.logger.debug(`Created section for course ${courseId} in term ${termId}`);
          } catch (err) {
            const errorMsg = `Failed to create section for course ${courseId} in term ${termName}: ${err?.message ?? err}`;
            errors.push(errorMsg);
            this.logger.error(errorMsg);
          }

          teacherIdx += 1;
          classroomIdx += 1;
        }

        this.logger.log(`Created sections for ${termName} ${startDate} (Level ${level})`);
      }
    } catch (err) {
      const errorMsg = `Course sections seeder error: ${err?.message ?? err}`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);
    }

    const duration = Date.now() - start;
    this.logger.log(`Course sections seeder completed: ${created} sections created in ${duration}ms`);
    
    return {
      seeder: this.name,
      success: errors.length === 0 && created > 0,
      recordsCreated: created,
      duration,
      errors: errors.length ? errors : undefined,
    };
  }
}
