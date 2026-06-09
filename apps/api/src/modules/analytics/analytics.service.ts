import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}
  getDashboardSummary(businessId: string, branchId?: string) { return this.analyticsRepository.getDashboardSummary(businessId, branchId); }
  getQueueSummary(businessId: string, branchId?: string) { return this.analyticsRepository.getQueueSummary(businessId, branchId); }
  getAppointmentSummary(businessId: string, branchId?: string) { return this.analyticsRepository.getAppointmentSummary(businessId, branchId); }
  getNotificationSummary(businessId: string, branchId?: string) { return this.analyticsRepository.getNotificationSummary(businessId, branchId); }
  getTodayActivity(businessId: string, branchId?: string) { return this.analyticsRepository.getTodayActivity(businessId, branchId); }
}