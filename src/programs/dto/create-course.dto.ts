import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateCourseDto {
  @IsUUID()
  @IsOptional()
  study_plan_id?: string;

  @IsUUID()
  @IsOptional()
  level_id?: string;

  @IsString()
  @IsOptional()
  degree_program_code?: string;

  @IsString()
  @IsOptional()
  study_plan_version?: string;

  @IsInt()
  @IsOptional()
  level_order?: number;

  @IsString()
  @MaxLength(20)
  code!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsNumber()
  @Min(0)
  credits!: number;

  @IsInt()
  @Min(0)
  hours_theory!: number;

  @IsInt()
  @Min(0)
  hours_practice!: number;

  @IsString()
  @IsIn(['Active', 'Inactive'])
  status!: string;
}
