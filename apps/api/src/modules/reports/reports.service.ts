import { Injectable } from '@nestjs/common';
import { ReportFilters, ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}
  dailyQueueReport(filters: ReportFilters) { return this.reportsRepository.dailyQueueReport(filters); }
  dailyAppointmentReport(filters: ReportFilters) { return this.reportsRepository.dailyAppointmentReport(filters); }
  staffActivityReport(filters: ReportFilters) { return this.reportsRepository.staffActivityReport(filters); }
  notificationReport(filters: ReportFilters) { return this.reportsRepository.notificationReport(filters); }
}
