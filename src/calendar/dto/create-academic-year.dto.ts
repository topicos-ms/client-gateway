import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsString, Min, MinLength } from 'class-validator';

export class CreateAcademicYearDto {
  @IsInt()
  @Min(2000)
  year: number;

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
}
