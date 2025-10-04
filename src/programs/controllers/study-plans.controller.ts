import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProgramsService } from '../services/programs.service';
import {
  CreateStudyPlanDto,
  ListStudyPlansDto,
  UpdateStudyPlanDto,
} from '../dto';

@Controller('study-plans')
export class StudyPlansController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  create(@Body() createStudyPlanDto: CreateStudyPlanDto) {
    return this.programsService.createStudyPlan(createStudyPlanDto);
  }

  @Get()
  findAll(@Query() listStudyPlansDto: ListStudyPlansDto) {
    return this.programsService.listStudyPlans(listStudyPlansDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findStudyPlan(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudyPlanDto: UpdateStudyPlanDto) {
    return this.programsService.updateStudyPlan(id, updateStudyPlanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programsService.removeStudyPlan(id);
  }
}
