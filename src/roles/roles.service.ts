import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    private readonly usersService: UsersService,
  ) {}

  create(createRoleDto: CreateRoleDto) {
    return this.roleModel.create(createRoleDto);
  }

  findAll() {
    return this.roleModel.find().exec();
  }

  async findOne(id: string) {
    const role = await this.roleModel.findById(id).exec();
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.roleModel
      .findByIdAndUpdate(id, updateRoleDto, {
        returnDocument: 'after',
      })
      .exec();
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
    return role;
  }

  async remove(id: string) {
    const role = await this.roleModel.findByIdAndDelete(id).exec();
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
    return role;
  }

  async assign(assignRoleDto: AssignRoleDto) {
    const role = await this.roleModel
      .findOne({ name: assignRoleDto.role })
      .exec();
    if (!role) {
      throw new NotFoundException(`Role ${assignRoleDto.role} not found`);
    }
    const user = await this.usersService.update(assignRoleDto.userId, {
      role: assignRoleDto.role,
    });
    return user;
  }
}
