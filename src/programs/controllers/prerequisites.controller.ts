import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProgramsService } from '../services/programs.service';
import {
  CreatePrerequisiteDto,
  ListPrerequisitesDto,
  UpdatePrerequisiteDto,
} from '../dto';

@Controller('prerequisites')
export class PrerequisitesController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  create(@Body() createPrerequisiteDto: CreatePrerequisiteDto) {
    return this.programsService.createPrerequisite(createPrerequisiteDto);
  }

  @Get()
  findAll(@Query() listPrerequisitesDto: ListPrerequisitesDto) {
    return this.programsService.listPrerequisites(listPrerequisitesDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findPrerequisite(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePrerequisiteDto: UpdatePrerequisiteDto,
  ) {
    return this.programsService.updatePrerequisite(id, updatePrerequisiteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programsService.removePrerequisite(id);
  }
}
