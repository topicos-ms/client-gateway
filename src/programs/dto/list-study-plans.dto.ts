import { PaginationDto } from '../../common';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListStudyPlansDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  degree_program_id?: string;

  @IsOptional()
  @IsString()
  degree_program_code?: string;

  @IsOptional()
  @IsBoolean()
  is_current?: boolean;
}
