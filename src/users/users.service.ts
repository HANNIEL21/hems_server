import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';

const PUBLIC_FIELDS = '-password -refreshToken -otp';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel
      .findOne({ email: createUserDto.email.toLowerCase() })
      .exec();
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const created = await this.userModel.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
    });
    return created;
  }

  async findAll(filter: FindAllUsersDto = {}) {
    const query: Record<string, unknown> = {};
    if (filter.role) query.role = filter.role;
    if (filter.search) {
      const regex = new RegExp(filter.search, 'i');
      query.$or = [{ email: regex }, { firstName: regex }, { lastName: regex }];
    }
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
      this.userModel
        .find(query)
        .select(PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findByRole(role: string) {
    return this.userModel.find({ role }).select(PUBLIC_FIELDS).exec();
  }

  findExceptRole(role: string) {
    return this.userModel
      .find({ role: { $ne: role } })
      .select(PUBLIC_FIELDS)
      .sort({ firstName: 1 })
      .exec();
  }

  findAdmins() {
    return this.userModel
      .find({ role: { $regex: /admin/i } })
      .select(PUBLIC_FIELDS)
      .sort({ firstName: 1 })
      .exec();
  }

  countAll() {
    return this.userModel.countDocuments().exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select(PUBLIC_FIELDS).exec();
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByEmailWithAuth(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password +refreshToken +otp')
      .exec();
  }

  async findByIdWithAuth(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(id)
      .select('+password +refreshToken +otp')
      .exec();
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { password: hashedPassword });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, {
        returnDocument: 'after',
      })
      .select(PUBLIC_FIELDS)
      .exec();
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async remove(id: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async setRefreshToken(id: string, hashedToken: string): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { refreshToken: hashedToken });
  }

  async clearRefreshToken(id: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      { $unset: { refreshToken: 1 } },
    );
  }

  async setOtp(
    id: string,
    hashedOtp: string,
    otpExpiresAt: Date,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      { otp: hashedOtp, otpExpiresAt },
    );
  }

  async clearOtp(id: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      { $unset: { otp: 1, otpExpiresAt: 1 } },
    );
  }

  async markLastLogin(id: string): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { lastLoginAt: new Date() });
  }
}
