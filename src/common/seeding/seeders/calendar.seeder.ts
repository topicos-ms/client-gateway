import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { NATS_SERVICE } from '../../../config';
import { ISeeder, SeederResult, SeedingContext } from '../interfaces/seeder.interface';
import { CalendarFixture } from '../fixtures/calendar.fixture';

@Injectable()
export class CalendarSeeder implements ISeeder {
  private readonly logger = new Logger(CalendarSeeder.name);

  readonly name = 'calendar';
  readonly order = 3;
  readonly dependencies = ['programs'];

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  async seed(context: SeedingContext): Promise<SeederResult> {
    const startTime = Date.now();
    let recordsCreated = 0;
    const errors: string[] = [];

    try {
      // Step 1: Create Academic Years
      this.logger.log('Creating academic years...');
      const academicYears = CalendarFixture.getAcademicYears();
      const academicYearIds = new Map<number, string>();

      for (const yearData of academicYears) {
        const yearId = await this.createAcademicYear(yearData);

        if (yearId) {
          academicYearIds.set(yearData.year, yearId);
          context.ids.academicYears.set(yearData.year.toString(), yearId);
          recordsCreated++;
          this.logger.debug(`Academic year created: ${yearData.name} (${yearId})`);
        }
      }

      // Step 2: Create Terms
      this.logger.log('Creating terms...');
      const terms = CalendarFixture.getTerms(academicYearIds);

      for (const termData of terms) {
        const termId = await this.createTerm(termData);

        if (termId) {
          // Store term ID with a composite key: name|start_date
          const termKey = `${termData.name}|${termData.start_date.toISOString().split('T')[0]}`;
          context.ids.terms.set(termKey, termId);
          recordsCreated++;
          this.logger.debug(`Term created: ${termData.name} (${termData.start_date.toISOString().split('T')[0]}) -> ${termId}`);
        }
      }

      // Step 3: Create Classrooms
      this.logger.log('Creating classrooms...');
      const classrooms = CalendarFixture.getClassrooms();

      for (const classroomData of classrooms) {
        const classroomId = await this.createClassroom(classroomData);

        if (classroomId) {
          context.ids.classrooms.set(classroomData.code, classroomId);
          recordsCreated++;
        }
      }

    } catch (error) {
      errors.push(`Calendar seeder error: ${error.message}`);
      this.logger.error(`Error in calendar seeder: ${error.message}`, error.stack);
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
    this.logger.log('Clearing calendar and facilities test data...');
    try {
      const calendarResponse = await firstValueFrom(
        this.client.send('calendar.clearTestData', {}).pipe(
          timeout(15000),
          catchError((error) => {
            this.logger.error(`Error calling calendar.clearTestData: ${error.message}`);
            throw error;
          }),
        ),
      );
      this.logger.log(`Calendar test data cleared: ${JSON.stringify(calendarResponse)}`);
      
      const facilitiesResponse = await firstValueFrom(
        this.client.send('facilities.clearTestData', {}).pipe(
          timeout(15000),
          catchError((error) => {
            this.logger.error(`Error calling facilities.clearTestData: ${error.message}`);
            throw error;
          }),
        ),
      );
      this.logger.log(`Facilities test data cleared: ${JSON.stringify(facilitiesResponse)}`);
      
      this.logger.log('Calendar and facilities test data cleared successfully');
    } catch (error) {
      this.logger.error(`Failed to clear calendar/facilities data: ${error.message}`);
      throw error;
    }
  }

  private async createAcademicYear(data: any): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.client.send('calendar.academicYears.create', data).pipe(
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
      this.logger.error(`Error creating academic year ${data.code}: ${error.message}`);
      return null;
    }
  }

  private async createTerm(data: any): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.client.send('calendar.terms.create', data).pipe(
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
      this.logger.error(`Error creating term ${data.code}: ${error.message}`);
      return null;
    }
  }

  private async createClassroom(data: any): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.client.send('facilities.classrooms.create', data).pipe(
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
      this.logger.error(`Error creating classroom ${data.code}: ${error.message}`);
      return null;
    }
  }
}
