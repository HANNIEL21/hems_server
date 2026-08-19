import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityService } from '../activity/activity.service';
import {
  EmergencyCase,
  EmergencyCaseDocument,
  EMERGENCY_STATUSES,
} from '../emergency_cases/entities/emergency_case.entity';
import { Incident, IncidentDocument } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { FindAllIncidentsDto } from './dto/find-all-incidents.dto';

const RESOURCE = 'incident';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<Incident>,
    @InjectModel(EmergencyCase.name)
    private readonly caseModel: Model<EmergencyCase>,
    private readonly activityService: ActivityService,
  ) {}

  async create(dto: CreateIncidentDto, actorId?: string) {
    const emergencyCase = await this.caseModel.findById(dto.case_id).exec();
    if (!emergencyCase) {
      throw new NotFoundException(
        `Emergency case with id ${dto.case_id} not found`,
      );
    }

    const created = await this.incidentModel.create({
      ...dto,
      case_id: new Types.ObjectId(dto.case_id),
      assigned_by: actorId ? new Types.ObjectId(actorId) : undefined,
      assigned_staff: dto.assigned_staff
        ? new Types.ObjectId(dto.assigned_staff)
        : undefined,
    });

    await this.caseModel
      .findByIdAndUpdate(
        dto.case_id,
        { incident: created._id, status: 'in_progress' },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    await this.recordActivity(
      actorId,
      'create',
      'Incident opened for emergency case',
      created,
    );
    return this.populated(created);
  }

  async findAll(filter: FindAllIncidentsDto = {}) {
    const query: Record<string, unknown> = {};
    if (filter.status) {
      const valid = EMERGENCY_STATUSES.includes(filter.status);
      if (valid) query['case_id.status'] = filter.status;
    }
    if (filter.severity_level) query.severity_level = filter.severity_level;
    if (filter.assigned_staff) query.assigned_staff = filter.assigned_staff;

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

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.incidentModel
        .find(query)
        .populate('case_id', 'incident_type status description location createdAt')
        .populate('assigned_by', 'firstName lastName email role')
        .populate('assigned_staff', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.incidentModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<IncidentDocument> {
    const incident = await this.incidentModel
      .findById(id)
      .populate('case_id', 'incident_type status description location createdAt')
      .populate('assigned_by', 'firstName lastName email role')
      .populate('assigned_staff', 'firstName lastName email role')
      .exec();
    if (!incident) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }
    return incident;
  }

  async update(
    id: string,
    dto: UpdateIncidentDto,
    actorId?: string,
  ): Promise<IncidentDocument> {
    const patch: Record<string, unknown> = { ...dto };
    if (dto.assigned_staff) {
      patch.assigned_staff = new Types.ObjectId(dto.assigned_staff);
    }
    if (dto.case_id) {
      patch.case_id = new Types.ObjectId(dto.case_id);
    }

    const updated = await this.incidentModel
      .findByIdAndUpdate(id, patch, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }
    await this.recordActivity(
      actorId,
      'update',
      'Incident updated',
      updated,
    );
    return this.populated(updated);
  }

  async updateStatus(
    id: string,
    status: string,
    actorId?: string,
  ): Promise<IncidentDocument> {
    const incident = await this.incidentModel.findById(id).exec();
    if (!incident) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }
    if (!EMERGENCY_STATUSES.includes(status)) {
      throw new NotFoundException(`Invalid incident status: ${status}`);
    }

    const patch: Partial<EmergencyCase> = { status: status as never };
    if (status === 'resolved') {
      patch.status = 'resolved';
      await this.incidentModel
        .findByIdAndUpdate(
          id,
          { resolved_at: new Date() },
          { returnDocument: 'after', runValidators: true },
        )
        .exec();
    }

    const emergencyCase = await this.caseModel
      .findByIdAndUpdate(incident.case_id, patch, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();
    if (!emergencyCase) {
      throw new NotFoundException(
        `Emergency case with id ${incident.case_id} not found`,
      );
    }

    await this.recordActivity(
      actorId,
      'status_change',
      `Incident status changed to ${status}`,
      incident,
    );
    return this.populated(incident);
  }

  async resolve(
    id: string,
    resolutionNote: string,
    actorId?: string,
  ): Promise<IncidentDocument> {
    const incident = await this.incidentModel.findById(id).exec();
    if (!incident) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }

    const now = new Date();
    const updated = await this.incidentModel
      .findByIdAndUpdate(
        id,
        { resolution_note: resolutionNote, resolved_at: now },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    await this.caseModel
      .findByIdAndUpdate(
        incident.case_id,
        { status: 'resolved', resolvedAt: now },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    await this.recordActivity(
      actorId,
      'resolve',
      'Incident resolved',
      updated!,
    );
    return this.populated(updated!);
  }

  async remove(id: string, actorId?: string): Promise<void> {
    const removed = await this.incidentModel.findByIdAndDelete(id).exec();
    if (!removed) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }
    await this.caseModel
      .findByIdAndUpdate(removed.case_id, { incident: null }, { runValidators: true })
      .exec();
    await this.recordActivity(
      actorId,
      'delete',
      'Incident deleted',
      removed,
    );
  }

  private async populated(incident: IncidentDocument) {
    return incident.populate([
      {
        path: 'case_id',
        select: 'incident_type status description location createdAt',
      },
      { path: 'assigned_by', select: 'firstName lastName email role' },
      { path: 'assigned_staff', select: 'firstName lastName email role' },
    ]);
  }

  private recordActivity(
    actorId: string | undefined,
    action: string,
    description: string,
    incident: IncidentDocument,
  ) {
    return this.activityService.record({
      user: actorId,
      action,
      resource: RESOURCE,
      description,
      meta: { incidentId: incident._id.toString() },
    });
  }
}