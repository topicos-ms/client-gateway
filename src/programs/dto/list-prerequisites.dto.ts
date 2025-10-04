import { PaginationDto } from '../../common';
import { IsOptional, IsUUID } from 'class-validator';

export class ListPrerequisitesDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  main_course_id?: string;

  @IsOptional()
  @IsUUID()
  required_course_id?: string;
}
