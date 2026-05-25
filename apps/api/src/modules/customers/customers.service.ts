import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { NotificationsService } from '../notifications/notifications.service';
import { BanResetDto } from './dto/ban-reset.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './interfaces/customer.interface';
import { CustomerNotificationContext, CustomersRepository } from './customers.repository';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(businessId: string, data: CreateCustomerDto): Promise<Customer> {
    const existingCustomer = await this.customersRepository.findByPhone(businessId, data.primaryPhone);
    if (existingCustomer) {
      throw new ConflictException('A customer with this phone already exists for this business');
    }

    try {
      return await this.customersRepository.create(businessId, data);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  findAllByBusinessId(businessId: string): Promise<Customer[]> {
    return this.customersRepository.findAllByBusinessId(businessId);
  }

  async findById(businessId: string, id: string): Promise<Customer> {
    const customer = await this.customersRepository.findById(businessId, id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async findByPhone(businessId: string, phone: string): Promise<Customer> {
    const customer = await this.customersRepository.findByPhone(businessId, phone);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(businessId: string, id: string, data: UpdateCustomerDto): Promise<Customer> {
    try {
      const customer = await this.customersRepository.update(businessId, id, data);
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
      return customer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  async resetBan(businessId: string, id: string, data: BanResetDto): Promise<Customer> {
    try {
      const customer = await this.customersRepository.resetBan(businessId, id, data);
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      const context = await this.customersRepository.getNotificationContext(businessId, id);
      if (context) {
        await this.safeCreateRenderedNotificationLog(businessId, context);
      }

      return customer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  private async safeCreateRenderedNotificationLog(businessId: string, context: CustomerNotificationContext): Promise<void> {
    try {
      await this.notificationsService.createRenderedLog(businessId, {
        customerId: context.customerId,
        language: context.language,
        templateKey: 'BAN_RESET',
        channel: 'WHATSAPP',
        recipient: context.customerPhone,
        variables: {
          customer_name: context.customerName,
          business_name: context.businessName
        }
      });
    } catch (error) {
      this.logger.warn(`Notification log creation failed for BAN_RESET: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}