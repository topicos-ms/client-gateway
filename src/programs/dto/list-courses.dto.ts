import { PaginationDto } from '../../common';
import { IsOptional, IsUUID } from 'class-validator';

export class ListCoursesDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  study_plan_id?: string;

  @IsOptional()
  @IsUUID()
  level_id?: string;
}
