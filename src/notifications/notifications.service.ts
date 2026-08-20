import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    return this.notificationModel.create(this.toDocument(dto));
  }

  createMany(dtos: CreateNotificationDto[]) {
    if (dtos.length === 0) return Promise.resolve([]);
    return this.notificationModel.insertMany(
      dtos.map((dto) => this.toDocument(dto)),
    );
  }

  findAll() {
    return this.notificationModel
      .find()
      .populate('recipient', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  findMine(userId: string, limit = 100) {
    return this.notificationModel
      .find({ recipient: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  unreadCount(userId: string) {
    return this.notificationModel
      .countDocuments({
        recipient: new Types.ObjectId(userId),
        read: false,
      })
      .exec();
  }

  async findOne(id: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findById(id)
      .populate('recipient', 'firstName lastName email role')
      .exec();
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return notification;
  }

  async update(
    id: string,
    dto: UpdateNotificationDto,
  ): Promise<NotificationDocument> {
    const updated = await this.notificationModel
      .findByIdAndUpdate(id, dto, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return updated;
  }

  async markRead(id: string, userId: string): Promise<NotificationDocument> {
    const updated = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, recipient: new Types.ObjectId(userId) },
        { read: true },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return updated;
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany(
        { recipient: new Types.ObjectId(userId), read: false },
        { read: true },
      )
      .exec();
  }

  async remove(id: string, userId?: string): Promise<void> {
    const query = userId
      ? { _id: id, recipient: new Types.ObjectId(userId) }
      : { _id: id };
    const removed = await this.notificationModel.findOneAndDelete(query).exec();
    if (!removed) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
  }

  private toDocument(dto: CreateNotificationDto) {
    return {
      recipient: new Types.ObjectId(dto.recipient),
      type: dto.type,
      title: dto.title,
      message: dto.message,
      caseId: dto.caseId ? new Types.ObjectId(dto.caseId) : undefined,
      incidentId: dto.incidentId
        ? new Types.ObjectId(dto.incidentId)
        : undefined,
      read: dto.read,
    };
  }
}
