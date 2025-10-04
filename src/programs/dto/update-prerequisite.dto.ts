import { PartialType } from '@nestjs/mapped-types';
import { CreatePrerequisiteDto } from './create-prerequisite.dto';
import { IsUUID } from 'class-validator';

export class UpdatePrerequisiteDto extends PartialType(CreatePrerequisiteDto) {
  @IsUUID()
  id: string;
}
