import { PartialType } from '@nestjs/mapped-types';
import { CreateLevelDto } from './create-level.dto';
import { IsUUID } from 'class-validator';

export class UpdateLevelDto extends PartialType(CreateLevelDto) {
  @IsUUID()
  id: string;
}
