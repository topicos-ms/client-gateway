import { Controller, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { SeedingService } from './seeding.service';

@Controller('seeding')
export class SeedingController {
  constructor(private readonly seedingService: SeedingService) {}

  @Post('run')
  @HttpCode(HttpStatus.ACCEPTED)
  async runSeeding(@Query('clear') clear?: string) {
    const clearBefore = clear === 'true';
    const progress = await this.seedingService.seedAll(clearBefore);

    const totalRecords = progress.results.reduce(
      (sum, r) => sum + r.recordsCreated,
      0,
    );
    const totalDuration = progress.results.reduce(
      (sum, r) => sum + r.duration,
      0,
    );
    const hasErrors = progress.results.some((r) => !r.success);

    return {
      success: !hasErrors,
      message: hasErrors
        ? 'Database seeding completed with some errors'
        : 'Database seeding completed successfully',
      summary: {
        totalRecords,
        totalDuration: `${totalDuration}ms`,
        totalSeeders: progress.totalSeeders,
        completedSeeders: progress.completedSeeders.length,
        timestamp: new Date().toISOString(),
      },
      details: progress.results.map((r) => ({
        seeder: r.seeder,
        success: r.success,
        records: r.recordsCreated,
        duration: `${r.duration}ms`,
        errors: r.errors,
      })),
    };
  }

  @Post('clear')
  @HttpCode(HttpStatus.OK)
  async clearData() {
    await this.seedingService.clearAllData();

    return {
      success: true,
      message: 'All test data cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
