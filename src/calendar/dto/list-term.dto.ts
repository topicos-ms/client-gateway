import { PaginationDto } from '../../common';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TERM_STATUSES, TermStatus } from './create-term.dto';

export class ListTermDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  academic_year_id?: string;

  @IsOptional()
  @IsEnum(TERM_STATUSES)
  status?: TermStatus;
}
