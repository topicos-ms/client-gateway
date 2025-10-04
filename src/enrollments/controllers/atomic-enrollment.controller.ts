import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EnrollmentsService } from '../services/enrollments.service';
import { CreateEnrollmentDetailDto } from '../dto';
import { IdempotencyKey } from '../../common/decorators';
import { IdempotencyService } from '../../common/services/idempotency.service';

@Controller('atomic-enrollment')
export class AtomicEnrollmentController {
  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @Post('enroll')
  @HttpCode(HttpStatus.CREATED)
  async enrollStudent(
    @Body() createEnrollmentDetailDto: CreateEnrollmentDetailDto,
    @IdempotencyKey() idempotencyKey: string | null,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException(
        'X-Idempotency-Key header is required for enrollment operations',
      );
    }

    const operationKey = `enroll:${idempotencyKey}:${createEnrollmentDetailDto.enrollment_id}:${createEnrollmentDetailDto.course_section_id}`;

    const result = await this.idempotencyService.executeWithIdempotency(
      operationKey,
      async () =>
        this.enrollmentsService.atomicEnroll(
          createEnrollmentDetailDto,
          idempotencyKey,
        ),
    );

    return {
      ...result.data,
      idempotency: {
        key: idempotencyKey,
        isNew: result.isNew,
      },
    };
  }

  @Get('course-section/:id/quota-status')
  async getQuotaStatus(@Param('id', ParseUUIDPipe) courseSectionId: string) {
    const status = await this.enrollmentsService.getCourseSectionQuotaStatus(
      courseSectionId,
    );

    return {
      success: true,
      data: status,
    };
  }

  @Get('idempotency/stats')
  async getIdempotencyStats() {
    return this.enrollmentsService.getIdempotencyStats();
  }
}
