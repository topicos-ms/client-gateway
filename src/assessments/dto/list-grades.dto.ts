import { PaginationDto } from '../../common';
import { IsOptional, IsUUID } from 'class-validator';

export class ListGradesDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  student_id?: string;

  @IsOptional()
  @IsUUID()
  course_section_id?: string;
}
