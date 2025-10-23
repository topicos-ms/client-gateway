import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout, of } from 'rxjs';
import { NATS_SERVICE } from '../../../config';
import {
  ISeeder,
  SeedingContext,
  SeederResult,
} from '../interfaces/seeder.interface';
import { EnrollmentDetailsFixture } from '../fixtures/enrollment-details.fixture';

@Injectable()
export class EnrollmentDetailsSeeder implements ISeeder {
  private readonly logger = new Logger(EnrollmentDetailsSeeder.name);
  readonly name = 'enrollment-details.seeder';
  readonly order = 90; // After enrollments (80)
  readonly dependencies = ['enrollments.seeder'];

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async clear(): Promise<void> {
    // Enrollment details are cleared when enrollments are cleared (CASCADE)
    this.logger.log(
      'Enrollment details will be cleared via enrollment CASCADE',
    );
  }

  async seed(context: SeedingContext): Promise<SeederResult> {
    const start = Date.now();
    const errors: string[] = [];
    let created = 0;

    try {
      // Get enrollments from context for the first student
      const enrollmentEntries = Array.from(context.ids.enrollments.entries());

      if (enrollmentEntries.length === 0) {
        errors.push('No enrollments found in context');
        this.logger.warn('No enrollments found');
        return {
          seeder: this.name,
          success: false,
          recordsCreated: 0,
          duration: Date.now() - start,
          errors,
        };
      }

      this.logger.log(`Found ${enrollmentEntries.length} enrollments in context`);

      // Get all course sections to find the ones for Primer and Segundo Semestre
      const courseSectionsResponse = await firstValueFrom(
        this.client.send('teaching.courseSections.list', { limit: 100 }).pipe(
          timeout(15000),
          catchError((err) => {
            this.logger.error(
              `Error fetching course sections: ${err?.message ?? err}`,
            );
            return of({ data: [] });
          }),
        ),
      );

      const courseSections = courseSectionsResponse?.data || [];

      if (courseSections.length === 0) {
        errors.push('No course sections found');
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

      // Get terms to map course sections
      const term1Key = 'Primer Semestre|2024-02-01';
      const term2Key = 'Segundo Semestre|2024-08-01';

      const term1Id = context.ids.terms.get(term1Key);
      const term2Id = context.ids.terms.get(term2Key);

      // Filter course sections by term
      const term1Sections = courseSections
        .filter((cs: any) => cs.term_id === term1Id)
        .slice(0, 5)
        .map((cs: any) => cs.id);

      const term2Sections = courseSections
        .filter((cs: any) => cs.term_id === term2Id)
        .slice(0, 5)
        .map((cs: any) => cs.id);

      this.logger.log(
        `Found ${term1Sections.length} sections for Primer Semestre`,
      );
      this.logger.log(
        `Found ${term2Sections.length} sections for Segundo Semestre`,
      );

      // Find enrollments for term1 and term2
      const enrollment1Key = enrollmentEntries.find(([key]) =>
        key.includes(term1Id || ''),
      );
      const enrollment2Key = enrollmentEntries.find(([key]) =>
        key.includes(term2Id || ''),
      );

      // Create enrollment details for Primer Semestre (Canceled enrollment)
      if (enrollment1Key && term1Sections.length > 0) {
        const [, enrollmentId] = enrollment1Key;
        this.logger.log(
          `Creating enrollment details for enrollment ${enrollmentId} (Primer Semestre - Canceled)`,
        );

        const details = EnrollmentDetailsFixture.createEnrollmentDetails(
          enrollmentId,
          term1Sections,
          'Approved', // Past term, so courses are approved
          85, // Final grade
        );

        for (const detailData of details) {
          try {
            await firstValueFrom(
              this.client
                .send('enrollment-details.create', detailData)
                .pipe(
                  timeout(10000),
                  catchError((err) => {
                    this.logger.error(
                      `Error creating enrollment detail: ${err?.message ?? err}`,
                    );
                    return of(null);
                  }),
                ),
            );
            created++;
            this.logger.debug(
              `Created enrollment detail ${created} for enrollment ${enrollmentId}`,
            );
          } catch (err) {
            const errorMsg = `Failed to create enrollment detail: ${err?.message ?? err}`;
            errors.push(errorMsg);
          }
        }
      }

      // Create enrollment details for Segundo Semestre (Canceled enrollment)
      if (enrollment2Key && term2Sections.length > 0) {
        const [, enrollmentId] = enrollment2Key;
        this.logger.log(
          `Creating enrollment details for enrollment ${enrollmentId} (Segundo Semestre - Canceled)`,
        );

        const details = EnrollmentDetailsFixture.createEnrollmentDetails(
          enrollmentId,
          term2Sections,
          'Approved', // Past term, so courses are approved
          90, // Final grade
        );

        for (const detailData of details) {
          try {
            await firstValueFrom(
              this.client
                .send('enrollment-details.create', detailData)
                .pipe(
                  timeout(10000),
                  catchError((err) => {
                    this.logger.error(
                      `Error creating enrollment detail: ${err?.message ?? err}`,
                    );
                    return of(null);
                  }),
                ),
            );
            created++;
            this.logger.debug(
              `Created enrollment detail ${created} for enrollment ${enrollmentId}`,
            );
          } catch (err) {
            const errorMsg = `Failed to create enrollment detail: ${err?.message ?? err}`;
            errors.push(errorMsg);
          }
        }
      }

      this.logger.log(
        `Enrollment details seeder completed: ${created} details created`,
      );
    } catch (err) {
      const errorMsg = `Enrollment details seeder error: ${err?.message ?? err}`;
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
