import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout, of } from 'rxjs';
import { NATS_SERVICE } from '../../../config';
import {
  ISeeder,
  SeedingContext,
  SeederResult,
} from '../interfaces/seeder.interface';
import { GradesFixture } from '../fixtures/grades.fixture';

@Injectable()
export class GradesSeeder implements ISeeder {
  private readonly logger = new Logger(GradesSeeder.name);
  readonly name = 'grades.seeder';
  readonly order = 100; // After enrollment-details (90)
  readonly dependencies = ['enrollment-details.seeder'];

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async clear(): Promise<void> {
    this.logger.log('Clearing grades test data...');
    try {
      await firstValueFrom(
        this.client.send('grades.clearTestData', {}).pipe(
          timeout(10000),
          catchError((error) => {
            this.logger.error('Error clearing grades data', error);
            return of({ success: false });
          }),
        ),
      );
      this.logger.log('Grades test data cleared');
    } catch (error) {
      this.logger.error('Failed to clear grades data', error);
      throw error;
    }
  }

  async seed(context: SeedingContext): Promise<SeederResult> {
    const start = Date.now();
    const errors: string[] = [];
    let created = 0;

    try {
      // Get first student from context
      const studentEntries = Array.from(context.ids.users.entries()).filter(
        ([email]) => email.startsWith('estudiante'),
      );

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
      this.logger.log(
        `Using first student: ${firstStudentEmail} (ID: ${firstStudentId})`,
      );

      // Get enrollment_details to extract course_section_ids and final_grades
      const enrollmentDetailsResponse = await firstValueFrom(
        this.client
          .send('enrollment-details.list', {
            limit: 100,
          })
          .pipe(
            timeout(15000),
            catchError((err) => {
              this.logger.error(
                `Error fetching enrollment details: ${err?.message ?? err}`,
              );
              return of({ data: [] });
            }),
          ),
      );

      const enrollmentDetails = enrollmentDetailsResponse?.data || [];

      if (enrollmentDetails.length === 0) {
        errors.push('No enrollment details found');
        this.logger.warn('No enrollment details found');
        return {
          seeder: this.name,
          success: false,
          recordsCreated: 0,
          duration: Date.now() - start,
          errors,
        };
      }

      this.logger.log(`Found ${enrollmentDetails.length} enrollment details`);

      // Filter enrollment details for the first student and create grades
      const studentEnrollmentDetails = enrollmentDetails.filter(
        (ed: any) => ed.enrollment?.student_id === firstStudentId,
      );

      this.logger.log(
        `Found ${studentEnrollmentDetails.length} enrollment details for student`,
      );

      // Create grades matching enrollment_details
      for (const enrollmentDetail of studentEnrollmentDetails) {
        const gradeData = GradesFixture.createGrade(
          enrollmentDetail.course_section_id,
          firstStudentId,
          enrollmentDetail.final_grade, // Use the same grade from enrollment_detail
        );

        try {
          await firstValueFrom(
            this.client.send('grades.create', gradeData).pipe(
              timeout(10000),
              catchError((err) => {
                this.logger.error(
                  `Error creating grade: ${err?.message ?? err}`,
                );
                return of(null);
              }),
            ),
          );
          created++;
          this.logger.debug(
            `Created grade ${created} for course_section ${enrollmentDetail.course_section_id} with grade ${enrollmentDetail.final_grade}`,
          );
        } catch (err) {
          const errorMsg = `Failed to create grade: ${err?.message ?? err}`;
          errors.push(errorMsg);
        }
      }

      this.logger.log(`Grades seeder completed: ${created} grades created`);
    } catch (err) {
      const errorMsg = `Grades seeder error: ${err?.message ?? err}`;
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
