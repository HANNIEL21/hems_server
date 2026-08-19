import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'crypto';
import { UsersService } from '../users/users.service';
import { ActivityService } from '../activity/activity.service';
import { UserDocument } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly activityService: ActivityService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto, meta?: RequestMeta) {
    const user = await this.usersService.create(dto);
    await this.recordActivity(
      user,
      'register',
      'auth',
      'User registered an account',
      meta,
    );
    return this.sanitizeUser(user);
  }

  async login(dto: LoginDto, meta?: RequestMeta) {
    const user = await this.usersService.findByEmailWithAuth(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user);
    await this.usersService.setRefreshToken(
      user._id.toString(),
      this.hashToken(tokens.refreshToken),
    );
    await this.usersService.markLastLogin(user._id.toString());
    await this.recordActivity(user, 'login', 'auth', 'User logged in', meta);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async logout(userId: string, meta?: RequestMeta) {
    const user = await this.usersService.findOne(userId);
    await this.usersService.clearRefreshToken(userId);
    await this.recordActivity(user, 'logout', 'auth', 'User logged out', meta);
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(refreshToken: string, meta?: RequestMeta) {
    let payload: { sub: string; tokenType?: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findByIdWithAuth(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (this.hashToken(refreshToken) !== user.refreshToken) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const tokens = await this.issueTokens(user);
    await this.usersService.setRefreshToken(
      user._id.toString(),
      this.hashToken(tokens.refreshToken),
    );
    await this.recordActivity(
      user,
      'refresh_token',
      'auth',
      'Access token refreshed',
      meta,
    );

    return tokens;
  }

  async forgotPassword(dto: ForgotPasswordDto, meta?: RequestMeta) {
    const user = await this.usersService.findByEmailWithAuth(dto.email);
    let generatedOtp: string | undefined;
    if (user) {
      generatedOtp = this.generateOtp();
      const expiresAt = new Date(Date.now() + this.otpTtlMinutes() * 60 * 1000);
      await this.usersService.setOtp(
        user._id.toString(),
        this.hashToken(generatedOtp),
        expiresAt,
      );
      await this.recordActivity(
        user,
        'forgot_password',
        'auth',
        'Password reset OTP requested',
        meta,
      );
    }

    const response: { message: string; devOtp?: string } = {
      message:
        'If an account exists with this email, an OTP has been sent to it',
    };
    if (process.env.NODE_ENV !== 'production' && generatedOtp) {
      response.devOtp = generatedOtp;
    }
    return response;
  }

  async resetPassword(dto: ResetPasswordDto, meta?: RequestMeta) {
    const user = await this.usersService.findByEmailWithAuth(dto.email);
    if (
      !user ||
      !user.otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (this.hashToken(dto.otp) !== user.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user._id.toString(), hashedPassword);
    await this.usersService.clearOtp(user._id.toString());
    await this.usersService.clearRefreshToken(user._id.toString());
    await this.recordActivity(
      user,
      'reset_password',
      'auth',
      'Password reset completed',
      meta,
    );

    return { message: 'Password reset successfully' };
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }

  private async issueTokens(user: UserDocument): Promise<AuthTokens> {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as StringValue,
      }),
      this.jwtService.signAsync(
        { ...payload, tokenType: 'refresh' },
        {
          expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN ??
            '7d') as StringValue,
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateOtp(): string {
    const length = Number(process.env.OTP_LENGTH ?? 6);
    let otp = '';
    for (let i = 0; i < length; i += 1) {
      otp += randomInt(0, 10);
    }
    return otp;
  }

  private otpTtlMinutes(): number {
    return Number(process.env.OTP_EXPIRES_IN_MIN ?? 10);
  }

  private sanitizeUser(user: UserDocument) {
    const safe = user.toObject() as unknown as Record<string, unknown>;
    delete safe.password;
    delete safe.refreshToken;
    delete safe.otp;
    delete safe.otpExpiresAt;
    return safe;
  }

  private recordActivity(
    user: UserDocument | { _id: unknown },
    action: string,
    resource: string,
    description: string,
    meta?: RequestMeta,
  ) {
    return this.activityService.record({
      user: String(user._id),
      action,
      resource,
      description,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });
  }
}
