import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmergencyCase } from '../emergency_cases/entities/emergency_case.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { User } from '../users/entities/user.entity';
import { DashboardStatsQueryDto } from './dto/dashboard-stats-query.dto';

interface CountRow {
  _id: string;
  count: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(EmergencyCase.name)
    private readonly caseModel: Model<EmergencyCase>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<Incident>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async getStats(userId: string, query: DashboardStatsQueryDto = {}) {
    const user = await this.userModel
      .findById(userId)
      .select('role')
      .lean()
      .exec();
    const role = (user?.role ?? 'user').toLowerCase().trim();
    if (role.includes('admin')) return this.adminStats(query);
    if (role.includes('staff')) return this.staffStats(userId, query);
    return this.userStats(userId, query);
  }

  private async adminStats(query: DashboardStatsQueryDto) {
    const dateFilter = this.dateFilter(query);

    const [caseFacet] = await this.caseModel.aggregate([
      ...(dateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          byType: [
            { $group: { _id: '$incident_type', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const [incidentFacet] = await this.incidentModel.aggregate([
      ...(dateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
      {
        $facet: {
          total: [{ $count: 'count' }],
          bySeverity: [
            { $group: { _id: '$severity_level', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          resolved: [
            { $match: { resolved_at: { $ne: null } } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const [usersFacet] = await this.userModel.aggregate([
      {
        $facet: {
          onDuty: [{ $match: { isActive: true } }, { $count: 'count' }],
          byRole: [
            { $group: { _id: '$role', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const byStatus = this.toMap(caseFacet?.byStatus);
    const byType = this.toMap(caseFacet?.byType);
    const totalCases = caseFacet?.total?.[0]?.count ?? 0;
    const totalIncidents = incidentFacet?.total?.[0]?.count ?? 0;
    const resolvedIncidents = incidentFacet?.resolved?.[0]?.count ?? 0;

    return {
      role: 'admin',
      totalCases,
      casesToday: dateFilter ? totalCases : undefined,
      openCases:
        (byStatus.pending ?? 0) +
        (byStatus.acknowledged ?? 0) +
        (byStatus.in_progress ?? 0),
      resolvedCases: byStatus.resolved ?? 0,
      casesByType: byType,
      casesByStatus: byStatus,
      totalIncidents,
      activeIncidents: totalIncidents - resolvedIncidents,
      resolvedIncidents,
      incidentsBySeverity: this.toMap(incidentFacet?.bySeverity),
      personnelOnDuty: usersFacet?.onDuty?.[0]?.count ?? 0,
      personnelByRole: this.toMap(usersFacet?.byRole),
      usersTotal: (usersFacet?.byRole ?? []).reduce(
        (sum, row) => sum + row.count,
        0,
      ),
    };
  }

  private async staffStats(userId: string, query: DashboardStatsQueryDto) {
    const dateFilter = this.dateFilter(query);

    const [facet] = await this.incidentModel.aggregate([
      { $match: { assigned_staff: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'emergencycases',
          localField: 'case_id',
          foreignField: '_id',
          as: 'case',
        },
      },
      { $unwind: { path: '$case', preserveNullAndEmptyArrays: true } },
      ...(dateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$case.status', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const byStatus = this.toMap(facet?.byStatus);
    const total = facet?.total?.[0]?.count ?? 0;

    return {
      role: 'staff',
      assignedTotal: total,
      assignedActive: (byStatus.pending ?? 0) + (byStatus.acknowledged ?? 0),
      assignedInProgress: byStatus.in_progress ?? 0,
      assignedResolved: byStatus.resolved ?? 0,
      assignedToday: dateFilter ? total : undefined,
    };
  }

  private async userStats(userId: string, query: DashboardStatsQueryDto) {
    const dateFilter = this.dateFilter(query);

    const [facet] = await this.caseModel.aggregate([
      { $match: { reported_by: new Types.ObjectId(userId) } },
      ...(dateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const byStatus = this.toMap(facet?.byStatus);
    const total = facet?.total?.[0]?.count ?? 0;

    return {
      role: 'user',
      totalReports: total,
      pending: byStatus.pending ?? 0,
      inProgress: byStatus.in_progress ?? 0,
      acknowledged: byStatus.acknowledged ?? 0,
      resolved: byStatus.resolved ?? 0,
      reportsToday: dateFilter ? total : undefined,
    };
  }

  private dateFilter(
    query: DashboardStatsQueryDto,
  ): Record<string, Date> | undefined {
    if (!query.from && !query.to) return undefined;
    const range: Record<string, Date> = {};
    if (query.from) {
      const from = new Date(query.from);
      from.setHours(0, 0, 0, 0);
      range.$gte = from;
    }
    if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      range.$lte = to;
    }
    return range;
  }

  private toMap(rows: CountRow[] | undefined) {
    return (rows ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});
  }
}
