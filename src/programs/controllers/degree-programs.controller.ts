import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProgramsService } from '../services/programs.service';
import {
  CreateDegreeProgramDto,
  ListDegreeProgramsDto,
  UpdateDegreeProgramDto,
} from '../dto';

@Controller('degree-programs')
export class DegreeProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  create(@Body() createDegreeProgramDto: CreateDegreeProgramDto) {
    return this.programsService.createDegreeProgram(createDegreeProgramDto);
  }

  @Get()
  findAll(@Query() listDegreeProgramsDto: ListDegreeProgramsDto) {
    return this.programsService.listDegreePrograms(listDegreeProgramsDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findDegreeProgram(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDegreeProgramDto: UpdateDegreeProgramDto,
  ) {
    return this.programsService.updateDegreeProgram(id, updateDegreeProgramDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programsService.removeDegreeProgram(id);
  }
}
