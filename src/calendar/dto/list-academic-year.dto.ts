import { PaginationDto } from '../../common';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ListAcademicYearDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(2000)
  year?: number;
}
