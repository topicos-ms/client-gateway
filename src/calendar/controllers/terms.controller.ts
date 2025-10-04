import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CalendarService } from '../services/calendar.service';
import { CreateTermDto, ListTermDto, UpdateTermDto } from '../dto';

@Controller('calendar/periods')
export class TermsController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  create(@Body() createTermDto: CreateTermDto) {
    return this.calendarService.createTerm(createTermDto);
  }

  @Get()
  findAll(@Query() listTermDto: ListTermDto) {
    return this.calendarService.findTerms(listTermDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarService.findOneTerm(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTermDto: UpdateTermDto) {
    return this.calendarService.updateTerm(id, updateTermDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calendarService.removeTerm(id);
  }
}
