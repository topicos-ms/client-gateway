import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { GradesService } from './grades.service';
import { CreateGradeDto, ListGradesDto, UpdateGradeDto } from './dto';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradesService.create(createGradeDto);
  }

  @Get()
  findAll(@Query() listGradesDto: ListGradesDto) {
    return this.gradesService.findAll(listGradesDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gradesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGradeDto: UpdateGradeDto) {
    return this.gradesService.update(id, updateGradeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gradesService.remove(id);
  }
}
