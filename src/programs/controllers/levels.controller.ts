import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProgramsService } from '../services/programs.service';
import { CreateLevelDto, ListLevelsDto, UpdateLevelDto } from '../dto';

@Controller('levels')
export class LevelsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  create(@Body() createLevelDto: CreateLevelDto) {
    return this.programsService.createLevel(createLevelDto);
  }

  @Get()
  findAll(@Query() listLevelsDto: ListLevelsDto) {
    return this.programsService.listLevels(listLevelsDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findLevel(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLevelDto: UpdateLevelDto) {
    return this.programsService.updateLevel(id, updateLevelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programsService.removeLevel(id);
  }
}
