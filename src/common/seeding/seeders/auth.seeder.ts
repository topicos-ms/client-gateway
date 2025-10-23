import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { NATS_SERVICE } from '../../../config';
import { ISeeder, SeederResult, SeedingContext } from '../interfaces/seeder.interface';
import { UsersFixture } from '../fixtures/users.fixture';

@Injectable()
export class AuthSeeder implements ISeeder {
  private readonly logger = new Logger(AuthSeeder.name);

  readonly name = 'auth';
  readonly order = 1;
  readonly dependencies = [];

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  async seed(context: SeedingContext): Promise<SeederResult> {
    const startTime = Date.now();
    let recordsCreated = 0;
    const errors: string[] = [];

    try {
      this.logger.log('Creating admins...');
      const admins = UsersFixture.getAdmins();
      for (const admin of admins) {
        const userId = await this.createUser(admin);
        if (userId) {
          context.ids.users.set(admin.email, userId);
          recordsCreated++;
        }
      }

      this.logger.log('Creating teachers...');
      const teachers = UsersFixture.getTeachers(5);
      for (const teacher of teachers) {
        const userId = await this.createUser(teacher);
        if (userId) {
          context.ids.users.set(teacher.email, userId);
          recordsCreated++;
        }
      }

      // Students will be created later after study plans are available
      this.logger.log('Skipping students creation - will be created after study plans');

    } catch (error) {
      errors.push(`Auth seeder error: ${error.message}`);
      this.logger.error(`Error in auth seeder: ${error.message}`, error.stack);
    }

    return {
      seeder: this.name,
      success: errors.length === 0 && recordsCreated > 0,
      recordsCreated,
      duration: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async createStudents(context: SeedingContext, studyPlanId: string): Promise<number> {
    this.logger.log('Creating students with study plan...');
    let recordsCreated = 0;

    try {
      const students = UsersFixture.getStudents(10, studyPlanId);
      for (const student of students) {
        const userId = await this.createUser(student);
        if (userId) {
          context.ids.users.set(student.email, userId);
          recordsCreated++;
        }
      }
    } catch (error) {
      this.logger.error(`Error creating students: ${error.message}`, error.stack);
    }

    return recordsCreated;
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing auth test data...');
    try {
      const response = await firstValueFrom(
        this.client.send('auth.clearTestData', {}).pipe(
          timeout(15000),
          catchError((error) => {
            this.logger.error(`Error calling auth.clearTestData: ${error.message}`);
            throw error;
          }),
        ),
      );
      this.logger.log(`Auth test data cleared successfully: ${JSON.stringify(response)}`);
    } catch (error) {
      this.logger.error(`Failed to clear auth data: ${error.message}`);
      throw error;
    }
  }

  private async createUser(userData: any): Promise<string | null> {
    try {
      // Map snake_case to camelCase for the auth-ms DTO
      const mappedData: any = {
        email: userData.email,
        password: userData.password,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.user_type, // ADMIN, TEACHER, or STUDENT
        phone: userData.phone,
      };

      // Add Student-specific fields
      if (userData.user_type === 'STUDENT') {
        mappedData.studentCode = userData.code;
        mappedData.studyPlanId = userData.study_plan_id;
        if (userData.birth_date) {
          mappedData.birthDate = userData.birth_date;
        }
        if (userData.sex) {
          mappedData.sex = userData.sex;
        }
      }

      // Add Teacher-specific fields (based on what the DTO accepts)
      if (userData.user_type === 'TEACHER') {
        // The DTO doesn't have category, workload, contract_type, hired_at
        // So we skip them for now - this is a limitation of the auth-ms DTO
      }

      const response = await firstValueFrom(
        this.client.send('auth.register', mappedData).pipe(
          timeout(10000),
          catchError((err) => {
            if (
              err.message?.includes('already exists') ||
              err.message?.includes('duplicate key') ||
              err.message?.includes('unique constraint')
            ) {
              return of({ alreadyExists: true });
            }
            throw err;
          }),
        ),
      );

      this.logger.debug(`auth.register response for ${userData.email}: ${JSON.stringify(response)}`);

      if (response?.alreadyExists) {
        try {
          const existing = await firstValueFrom(
            this.client.send('auth.findByEmail', { email: userData.email }).pipe(timeout(5000)),
          );
          return existing?.user?.id || existing?.id || null;
        } catch {
          return null;
        }
      }

      return response?.user?.id || response?.id || null;
    } catch (error) {
      this.logger.error(`Error creating user ${userData.email}: ${error.message}`);
      return null;
    }
  }
}
