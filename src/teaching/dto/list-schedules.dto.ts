import { PaginationDto } from '../../common';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListSchedulesDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  course_section_id?: string;

  @IsOptional()
  @IsUUID()
  classroom_id?: string;

  @IsOptional()
  @IsString()
  weekday?: string;
}
