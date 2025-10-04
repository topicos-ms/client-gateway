import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateScheduleDto {
  @IsUUID()
  course_section_id!: string;

  @IsUUID()
  @IsOptional()
  classroom_id?: string;

  @IsString()
  @MaxLength(10)
  weekday!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  time_start!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  time_end!: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  date_start?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  date_end?: Date;
}
