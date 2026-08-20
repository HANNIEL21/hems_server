import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { FindAllActivityDto } from './dto/find-all-activity.dto';

interface StatsRow {
  _id: string;
  count: number;
}

interface StatsFacetResult {
  total: { count: number }[];
  byAction: StatsRow[];
  byResource: StatsRow[];
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<Activity>,
  ) {}

  record(dto: CreateActivityDto): Promise<ActivityDocument> {
    return this.activityModel.create({
      ...dto,
      user: dto.user ? new Types.ObjectId(dto.user) : undefined,
      targetUser: dto.targetUser
        ? new Types.ObjectId(dto.targetUser)
        : undefined,
    });
  }

  findAll(filter: FindAllActivityDto = {}) {
    const query: QueryFilter<Activity> = {};
    if (filter.action) query.action = filter.action;
    if (filter.resource) query.resource = filter.resource;
    if (filter.user) query.user = new Types.ObjectId(filter.user);
    if (filter.from || filter.to) {
      const range: Record<string, Date> = {};
      if (filter.from) {
        const from = new Date(filter.from);
        from.setHours(0, 0, 0, 0);
        range.$gte = from;
      }
      if (filter.to) {
        const to = new Date(filter.to);
        to.setHours(23, 59, 59, 999);
        range.$lte = to;
      }
      query.createdAt = range;
    }

    return this.activityModel
      .find(query)
      .populate('user', 'email firstName lastName role')
      .populate('targetUser', 'email firstName lastName role')
      .sort({ createdAt: -1 })
      .exec();
  }

  findByUser(userId: string) {
    return this.activityModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('user', 'firstName lastName email role')
      .populate('targetUser', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  findByCase(caseId: string) {
    return this.activityModel
      .find({ 'meta.caseId': caseId })
      .populate('user', 'firstName lastName email role')
      .populate('targetUser', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  findByAction(action: string) {
    return this.activityModel
      .find({ action })
      .populate('user', 'email firstName lastName role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getStats() {
    const [result] = await this.activityModel.aggregate<StatsFacetResult>([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byAction: [
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byResource: [
            { $group: { _id: '$resource', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    const toMap = (rows: StatsRow[] | undefined) =>
      (rows ?? []).reduce<Record<string, number>>((acc, row) => {
        acc[row._id] = row.count;
        return acc;
      }, {});

    return {
      total: result?.total?.[0]?.count ?? 0,
      byAction: toMap(result?.byAction),
      byResource: toMap(result?.byResource),
    };
  }

  async findOne(id: string): Promise<ActivityDocument | null> {
    return this.activityModel.findById(id).populate('user').exec();
  }

  async remove(id: string): Promise<ActivityDocument | null> {
    return this.activityModel.findByIdAndDelete(id).exec();
  }
}
