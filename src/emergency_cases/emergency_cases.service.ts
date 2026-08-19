import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, Types } from 'mongoose';
import { ActivityService } from '../activity/activity.service';
import {
  EmergencyCase,
  EmergencyCaseDocument,
} from './entities/emergency_case.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { CreateEmergencyCaseDto } from './dto/create-emergency_case.dto';
import { UpdateEmergencyCaseDto } from './dto/update-emergency_case.dto';
import { AssignEmergencyCaseDto } from './dto/assign-emergency-case.dto';
import { FindAllEmergencyCasesDto } from './dto/find-all-emergency-cases.dto';

const RESOURCE = 'emergency_case';

@Injectable()
export class EmergencyCasesService {
  constructor(
    @InjectModel(EmergencyCase.name)
    private readonly caseModel: Model<EmergencyCase>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<Incident>,
    private readonly activityService: ActivityService,
  ) {}

  async create(dto: CreateEmergencyCaseDto, actorId?: string) {
    const created = await this.caseModel.create({
      ...dto,
      reported_by: new Types.ObjectId(actorId),
    });
    await this.recordActivity(
      actorId,
      'create',
      'Emergency case reported',
      created,
    );
    return this.populated(created);
  }

  async findAll(filter: FindAllEmergencyCasesDto = {}) {
    const query: QueryFilter<EmergencyCase> = {};
    if (filter.status) query.status = filter.status;
    if (filter.incident_type) query.incident_type = filter.incident_type;
    if (filter.reported_by) query.reported_by = filter.reported_by;

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
      this.caseModel
        .find(query)
        .populate('reported_by', 'firstName lastName email phone')
        .populate({
          path: 'incident',
          select: 'severity_level assigned_staff resolved_at resolution_note',
          populate: {
            path: 'assigned_staff',
            select: 'firstName lastName email role',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.caseModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<EmergencyCaseDocument> {
    const emergencyCase = await this.caseModel
      .findById(id)
      .populate('reported_by', 'firstName lastName email phone')
      .populate({
        path: 'incident',
        select: 'severity_level assigned_staff resolved_at resolution_note',
        populate: {
          path: 'assigned_staff',
          select: 'firstName lastName email role',
        },
      })
      .exec();
    if (!emergencyCase) {
      throw new NotFoundException(`Emergency case with id ${id} not found`);
    }
    return emergencyCase;
  }

  async update(
    id: string,
    dto: UpdateEmergencyCaseDto,
    actorId?: string,
  ): Promise<EmergencyCaseDocument> {
    const updated = await this.caseModel
      .findByIdAndUpdate(id, dto, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Emergency case with id ${id} not found`);
    }
    await this.recordActivity(
      actorId,
      'update',
      'Emergency case updated',
      updated,
    );
    return this.populated(updated);
  }

  async assign(
    id: string,
    dto: AssignEmergencyCaseDto,
    actorId?: string,
  ): Promise<EmergencyCaseDocument> {
    const emergencyCase = await this.caseModel.findById(id).exec();
    if (!emergencyCase) {
      throw new NotFoundException(`Emergency case with id ${id} not found`);
    }

    const wasAssigned = !!emergencyCase.incident;

    if (emergencyCase.incident) {
      const patch: Record<string, unknown> = {
        assigned_staff: new Types.ObjectId(dto.assigned_staff),
      };
      if (dto.severity_level) patch.severity_level = dto.severity_level;
      if (actorId) patch.assigned_by = new Types.ObjectId(actorId);
      const incident = await this.incidentModel
        .findByIdAndUpdate(emergencyCase.incident, patch, {
          returnDocument: 'after',
          runValidators: true,
        })
        .exec();
      if (!incident) {
        throw new NotFoundException(
          `Incident linked to emergency case ${id} not found`,
        );
      }
    } else {
      const created = await this.incidentModel.create({
        case_id: emergencyCase._id,
        assigned_by: actorId ? new Types.ObjectId(actorId) : undefined,
        assigned_staff: new Types.ObjectId(dto.assigned_staff),
        severity_level: dto.severity_level ?? 'medium',
      });
      await this.caseModel
        .findByIdAndUpdate(
          id,
          { incident: created._id, status: 'in_progress' },
          { returnDocument: 'after', runValidators: true },
        )
        .exec();
    }

    const updated = await this.findOne(id);
    const populatedIncident = updated.incident as unknown as {
      assigned_staff?: {
        firstName?: string;
        lastName?: string;
        email?: string;
      } | null;
    } | null;
    const staff = populatedIncident?.assigned_staff;
    const staffName = staff
      ? [staff.firstName, staff.lastName].filter(Boolean).join(' ') ||
        staff.email ||
        'staff member'
      : 'staff member';

    await this.activityService.record({
      user: actorId,
      action: 'assign',
      resource: RESOURCE,
      description: `Emergency case ${
        wasAssigned ? 'reassigned to' : 'assigned to'
      } ${staffName}`,
      targetUser: dto.assigned_staff,
      meta: { caseId: id },
    });

    return updated;
  }

  async remove(id: string, actorId?: string): Promise<void> {
    const removed = await this.caseModel.findByIdAndDelete(id).exec();
    if (!removed) {
      throw new NotFoundException(`Emergency case with id ${id} not found`);
    }
    await this.recordActivity(
      actorId,
      'delete',
      'Emergency case deleted',
      removed,
    );
  }

  private async populated(emergencyCase: EmergencyCaseDocument) {
    return emergencyCase.populate([
      { path: 'reported_by', select: 'firstName lastName email phone' },
      {
        path: 'incident',
        select: 'severity_level assigned_staff resolved_at resolution_note',
        populate: {
          path: 'assigned_staff',
          select: 'firstName lastName email role',
        },
      },
    ]);
  }

  private recordActivity(
    actorId: string | undefined,
    action: string,
    description: string,
    emergencyCase: EmergencyCaseDocument,
  ) {
    return this.activityService.record({
      user: actorId,
      action,
      resource: RESOURCE,
      description,
      meta: { caseId: emergencyCase._id.toString() },
    });
  }
}
