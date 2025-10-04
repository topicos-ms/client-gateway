import { PartialType } from '@nestjs/mapped-types';
import { CreateStudyPlanDto } from './create-study-plan.dto';
import { IsUUID } from 'class-validator';

export class UpdateStudyPlanDto extends PartialType(CreateStudyPlanDto) {
  @IsUUID()
  id: string;
}
