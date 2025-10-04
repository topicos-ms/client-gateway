import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateStudyPlanDto {
  @IsUUID()
  @IsOptional()
  degree_program_id?: string;

  @IsString()
  @IsOptional()
  degree_program_code?: string;

  @IsString()
  @MaxLength(20)
  version!: string;

  @IsBoolean()
  @IsOptional()
  is_current?: boolean;

  @Type(() => Date)
  @IsDate()
  valid_from!: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  valid_to?: Date;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  resolution?: string;
}
