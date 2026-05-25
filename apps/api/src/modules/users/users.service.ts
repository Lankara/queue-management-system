import { ConflictException, Injectable } from '@nestjs/common';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { hashPassword } from '../../common/utils/password.util';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './interfaces/user.interface';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findByPhone(phone);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    await this.ensureUniqueEmail(data.email);
    await this.ensureUniquePhone(data.phone);

    const passwordHash = await hashPassword(data.password);

    try {
      return await this.usersRepository.createUser({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        passwordHash,
        preferredLanguage: data.preferredLanguage
      });
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  updateLastLogin(id: string): Promise<User | null> {
    return this.usersRepository.updateLastLogin(id);
  }

  setUserActiveStatus(id: string, isActive: boolean): Promise<User | null> {
    return this.usersRepository.setUserActiveStatus(id, isActive);
  }

  private async ensureUniqueEmail(email?: string): Promise<void> {
    if (!email) {
      return;
    }

    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }
  }

  private async ensureUniquePhone(phone?: string): Promise<void> {
    if (!phone) {
      return;
    }

    const existingUser = await this.usersRepository.findByPhone(phone);

    if (existingUser) {
      throw new ConflictException('A user with this phone already exists');
    }
  }
}