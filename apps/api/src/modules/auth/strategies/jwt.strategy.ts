import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '../../../config/env';
import { UsersRepository } from '../../users/users.repository';
import { AuthenticatedUser } from '../interfaces/auth-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersRepository: UsersRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.jwtSecret
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findById(payload.sub);
    const businesses = await this.usersRepository.findBusinessRolesByUserId(payload.sub);

    return {
      id: payload.sub,
      fullName: user?.fullName ?? '',
      email: payload.email,
      phone: payload.phone,
      preferredLanguage: user?.preferredLanguage ?? 'en',
      isActive: user?.isActive ?? true,
      createdAt: user?.createdAt ?? new Date(),
      updatedAt: user?.updatedAt ?? null,
      roles: payload.roles,
      businessIds: payload.businessIds,
      businesses
    };
  }
}
