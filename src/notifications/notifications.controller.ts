import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get('mine')
  findMine(@CurrentUser('userId') userId: string) {
    return this.notificationsService.findMine(userId);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('userId') userId: string) {
    return this.notificationsService.unreadCount(userId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('userId') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.notificationsService.markRead(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.notificationsService.remove(id, userId);
  }
}
