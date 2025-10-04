import { PaginationDto } from '../../common';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListCourseSectionsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  course_id?: string;

  @IsOptional()
  @IsUUID()
  term_id?: string;

  @IsOptional()
  @IsUUID()
  teacher_id?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
