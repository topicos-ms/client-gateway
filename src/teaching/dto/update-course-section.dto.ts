import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseSectionDto } from './create-course-section.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateCourseSectionDto extends PartialType(CreateCourseSectionDto) {
  @IsUUID()
  @IsOptional()
  id?: string;
}
