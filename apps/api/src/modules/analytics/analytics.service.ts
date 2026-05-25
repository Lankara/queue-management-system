import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}
  getDashboardSummary(businessId: string) { return this.analyticsRepository.getDashboardSummary(businessId); }
  getQueueSummary(businessId: string) { return this.analyticsRepository.getQueueSummary(businessId); }
  getAppointmentSummary(businessId: string) { return this.analyticsRepository.getAppointmentSummary(businessId); }
  getNotificationSummary(businessId: string) { return this.analyticsRepository.getNotificationSummary(businessId); }
  getTodayActivity(businessId: string) { return this.analyticsRepository.getTodayActivity(businessId); }
}
