import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout, of } from 'rxjs';
import { NATS_SERVICE } from '../../../config';
import { ISeeder, SeedingContext, SeederResult } from '../interfaces/seeder.interface';
import { EnrollmentsFixture } from '../fixtures/enrollments.fixture';

@Injectable()
export class EnrollmentsSeeder implements ISeeder {
  private readonly logger = new Logger(EnrollmentsSeeder.name);
  readonly name = 'enrollments.seeder';
  readonly order = 80; // After schedules (70)
  readonly dependencies = ['calendar.seeder']; // Needs terms

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async clear(): Promise<void> {
    this.logger.log('Clearing enrollments test data...');
    try {
      await firstValueFrom(
        this.client.send('enrollments.clearTestData', {}).pipe(
          timeout(10000),
          catchError((error) => {
            this.logger.error('Error clearing enrollments data', error);
            return of({ success: false });
          }),
        ),
      );
      this.logger.log('Enrollments test data cleared');
    } catch (error) {
      this.logger.error('Failed to clear enrollments data', error);
      throw error;
    }
  }

  async seed(context: SeedingContext): Promise<SeederResult> {
    const start = Date.now();
    const errors: string[] = [];
    let created = 0;

    try {
      // Get first student from context (students have email like "estudiante1@uagrm.edu.bo")
      this.logger.log(
        `Context has ${context.ids.users.size} users: ${Array.from(context.ids.users.keys()).join(', ')}`,
      );

      const studentEntries = Array.from(context.ids.users.entries()).filter(([email]) =>
        email.startsWith('estudiante'),
      );

      this.logger.log(`Found ${studentEntries.length} students in context`);

      if (studentEntries.length === 0) {
        errors.push('No students found in context');
        this.logger.warn('No students found');
        return {
          seeder: this.name,
          success: false,
          recordsCreated: 0,
          duration: Date.now() - start,
          errors,
        };
      }

      const [firstStudentEmail, firstStudentId] = studentEntries[0];
      this.logger.log(`Using first student: ${firstStudentEmail} (ID: ${firstStudentId})`);

      // Get terms from context
      // Looking for: "Primer Semestre|2024-02-01", "Segundo Semestre|2024-08-01", and "Primer Semestre|2025-02-01"
      const term1Key = 'Primer Semestre|2024-02-01';
      const term2Key = 'Segundo Semestre|2024-08-01';
      const term3Key = 'Primer Semestre|2025-02-01';

      const term1Id = context.ids.terms.get(term1Key);
      const term2Id = context.ids.terms.get(term2Key);
      const term3Id = context.ids.terms.get(term3Key);

      if (!term1Id) {
        errors.push(`Term not found for key: ${term1Key}`);
        this.logger.warn(`Term not found: ${term1Key}`);
      }
      if (!term2Id) {
        errors.push(`Term not found for key: ${term2Key}`);
        this.logger.warn(`Term not found: ${term2Key}`);
      }
      if (!term3Id) {
        errors.push(`Term not found for key: ${term3Key}`);
        this.logger.warn(`Term not found: ${term3Key}`);
      }

      if (!term1Id && !term2Id && !term3Id) {
        return {
          seeder: this.name,
          success: false,
          recordsCreated: 0,
          duration: Date.now() - start,
          errors,
        };
      }

      this.logger.log(`Found term 1 ID: ${term1Id}`);
      this.logger.log(`Found term 2 ID: ${term2Id}`);
      this.logger.log(`Found term 3 ID: ${term3Id}`);

      // Create enrollments
      const enrollments: any[] = [];

      // Enrollments for past terms (Canceled)
      if (term1Id) {
        enrollments.push(
          EnrollmentsFixture.createEnrollment(
            firstStudentId,
            term1Id,
            '2024-02-15', // Enrollment date
            'Canceled', // Changed to Canceled
            'Regular',
          ),
        );
      }

      if (term2Id) {
        enrollments.push(
          EnrollmentsFixture.createEnrollment(
            firstStudentId,
            term2Id,
            '2024-08-15', // Enrollment date
            'Canceled', // Changed to Canceled
            'Regular',
          ),
        );
      }

      // Enrollment for current term (Active)
      if (term3Id) {
        enrollments.push(
          EnrollmentsFixture.createEnrollment(
            firstStudentId,
            term3Id,
            '2025-02-15', // Enrollment date
            'Active', // New enrollment is Active
            'Regular',
          ),
        );
      }

      this.logger.log(`Creating ${enrollments.length} enrollments...`);

      // Create each enrollment via NATS
      for (const enrollmentData of enrollments) {
        try {
          const result = await firstValueFrom(
            this.client.send('enrollments.create', enrollmentData).pipe(
              timeout(10000),
              catchError((error) => {
                this.logger.error(
                  `Error creating enrollment: ${JSON.stringify(enrollmentData)}`,
                  error,
                );
                return of(null);
              }),
            ),
          );

          if (result && result.id) {
            created++;
            this.logger.log(`Created enrollment ${created}: ${result.id}`);

            // Store enrollment ID in context
            context.ids.enrollments.set(
              `${firstStudentId}|${enrollmentData.term_id}`,
              result.id,
            );
          } else {
            errors.push(`Failed to create enrollment for term ${enrollmentData.term_id}`);
          }
        } catch (err) {
          const errorMsg = `Failed to create enrollment: ${err?.message ?? err}`;
          errors.push(errorMsg);
        }
      }

      this.logger.log(`Enrollments seeder completed: ${created} enrollments created`);
    } catch (err) {
      const errorMsg = `Enrollments seeder error: ${err?.message ?? err}`;
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
