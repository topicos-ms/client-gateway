import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export const TERM_STATUSES = ['planned', 'active', 'finished', 'pending', 'completed'] as const;
export type TermStatus = (typeof TERM_STATUSES)[number];

export class CreateTermDto {
  @IsUUID()
  @IsOptional()
  academic_year_id?: string;

  @IsInt()
  @Min(2000)
  @IsOptional()
  year?: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @IsEnum(TERM_STATUSES)
  status: TermStatus;
}
