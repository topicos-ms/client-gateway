import { PaginationDto } from '../../common';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ListClassroomsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  building?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  min_capacity?: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
