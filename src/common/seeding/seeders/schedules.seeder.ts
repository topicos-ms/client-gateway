import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { ISeeder, SeedingContext, SeederResult } from '../interfaces/seeder.interface';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from '../../../config';
import { SchedulesFixture } from '../fixtures/schedules.fixture';

@Injectable()
export class SchedulesSeeder implements ISeeder {
  readonly name = 'schedules.seeder';
  readonly order = 70; // run after course-sections
  readonly dependencies = ['course-sections.seeder'];

  private readonly logger = new Logger(SchedulesSeeder.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async clear(): Promise<void> {
    // Schedules are cleared when course_sections are cleared (CASCADE)
    this.logger.log('Schedules will be cleared via course_section CASCADE');
  }

  async seed(context: SeedingContext): Promise<SeederResult> {
    const start = Date.now();
    const errors: string[] = [];
    let created = 0;

    try {
      // Get all course sections from the database
      this.logger.log('Fetching course sections to assign schedules...');
      
      const courseSectionsResponse = await firstValueFrom(
        this.client.send('teaching.courseSections.list', { limit: 100 }).pipe(
          timeout(15000),
          catchError((err) => {
            this.logger.error(`Error fetching course sections: ${err?.message ?? err}`);
            return of({ data: [] });
          })
        )
      );

      const courseSections = courseSectionsResponse?.data || [];
      
      if (courseSections.length === 0) {
        errors.push('No course sections found to assign schedules');
        this.logger.warn('No course sections found');
        return {
          seeder: this.name,
          success: false,
          recordsCreated: 0,
          duration: Date.now() - start,
          errors,
        };
      }

      this.logger.log(`Found ${courseSections.length} course sections`);

      // Extract section IDs and classroom IDs
      const sectionIds = courseSections.map((section: any) => section.id);
      const classroomIds = courseSections
        .map((section: any) => section.classroom_id)
        .filter((id: string) => !!id);

      // Generate schedules for all sections
      const schedules = SchedulesFixture.getSchedulesForMultipleSections(sectionIds, classroomIds);

      this.logger.log(`Creating ${schedules.length} schedules...`);

      // Create each schedule
      for (const scheduleData of schedules) {
        try {
          await firstValueFrom(
            this.client.send('teaching.schedules.create', scheduleData).pipe(
              timeout(10000),
              catchError((err) => {
                this.logger.error(`Error creating schedule: ${err?.message ?? err}`);
                return of(null);
              })
            )
          );
          created++;
          this.logger.debug(
            `Created schedule for section ${scheduleData.course_section_id} on ${scheduleData.weekday} ${scheduleData.time_start}-${scheduleData.time_end}`
          );
        } catch (err) {
          const errorMsg = `Failed to create schedule for section ${scheduleData.course_section_id}: ${err?.message ?? err}`;
          errors.push(errorMsg);
        }
      }

      this.logger.log(`Schedules seeder completed: ${created} schedules created`);
    } catch (err) {
      const errorMsg = `Schedules seeder error: ${err?.message ?? err}`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);
    }

    const duration = Date.now() - start;
    return {
      seeder: this.name,
      success: errors.length === 0 && created > 0,
      recordsCreated: created,
      duration,
      errors: errors.length ? errors : undefined,
    };
  }
}
