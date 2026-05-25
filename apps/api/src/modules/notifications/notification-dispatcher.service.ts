import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppProvider } from '../whatsapp/whatsapp.provider';
import { NotificationLog } from './interfaces/notification.interface';
import { NotificationsRepository } from './notifications.repository';
import { NotificationProvider, NotificationPayload } from './providers/notification-provider.interface';

export interface DispatchProviderSummary {
  provider: string;
  channel: string;
  attempted: number;
  sent: number;
  failed: number;
  simulated: number;
}

export interface DispatchPendingNotificationsResult {
  requested: number;
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  simulated: number;
  durationMs: number;
  providers: DispatchProviderSummary[];
}

export interface NotificationDispatchSummary {
  pendingCount: number;
  sentToday: number;
  failedToday: number;
  simulatedToday: number;
  whatsappEnabled: boolean;
  whatsappDevMode: boolean;
  workerEnabled: boolean;
}

function parseBoolean(value: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes((value ?? '').toLowerCase());
}

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);
  private readonly retryCounts = new Map<string, number>();
  private readonly maxInMemoryRetries = 3;

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly whatsAppProvider: WhatsAppProvider
  ) {}

  async dispatchPendingNotifications(limit = 25): Promise<DispatchPendingNotificationsResult> {
    const startedAt = Date.now();
    const logs = await this.notificationsRepository.findPendingLogs(limit);
    const providerSummaries = new Map<string, DispatchProviderSummary>();
    const result: DispatchPendingNotificationsResult = {
      requested: limit,
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      simulated: 0,
      durationMs: 0,
      providers: []
    };

    this.logger.log(`dispatch batch started requested=${limit} pendingSelected=${logs.length}`);

    for (const log of logs) {
      result.processed += 1;
      const provider = this.getProvider(log.channel);
      if (!provider) {
        result.skipped += 1;
        await this.markFailed(log, `Unsupported notification channel: ${log.channel}`);
        continue;
      }

      const summary = this.getProviderSummary(providerSummaries, provider, log.channel);
      summary.attempted += 1;

      const retryCount = this.retryCounts.get(log.id) ?? 0;
      if (retryCount >= this.maxInMemoryRetries) {
        result.failed += 1;
        summary.failed += 1;
        await this.markFailed(log, 'Notification retry limit reached');
        continue;
      }

      const payload: NotificationPayload = {
        notificationId: log.id,
        businessId: log.businessId,
        channel: log.channel,
        recipient: log.recipient,
        messageBody: log.messageBody
      };

      const sendResult = await provider.send(payload);
      if (sendResult.success) {
        this.retryCounts.delete(log.id);
        result.sent += 1;
        summary.sent += 1;
        if (sendResult.simulated) {
          result.simulated += 1;
          summary.simulated += 1;
        }
        await this.notificationsRepository.markLogStatus(log.businessId, log.id, { status: 'SENT' });
        this.logger.log(`notificationId=${log.id} channel=${log.channel} provider=${sendResult.provider} sent simulated=${Boolean(sendResult.simulated)}`);
      } else {
        const nextRetryCount = retryCount + 1;
        this.retryCounts.set(log.id, nextRetryCount);
        result.failed += 1;
        summary.failed += 1;
        const reason = sendResult.errorMessage ?? 'Notification provider failed';
        if (nextRetryCount >= this.maxInMemoryRetries) {
          await this.markFailed(log, reason);
        } else {
          this.logger.warn(`notificationId=${log.id} channel=${log.channel} failedAttempt=${nextRetryCount} reason=${reason}`);
        }
      }
    }

    result.durationMs = Date.now() - startedAt;
    result.providers = [...providerSummaries.values()];
    this.logger.log(`dispatch batch completed processed=${result.processed} sent=${result.sent} failed=${result.failed} skipped=${result.skipped} simulated=${result.simulated} durationMs=${result.durationMs}`);
    return result;
  }

  async getDispatchSummary(): Promise<NotificationDispatchSummary> {
    const counts = await this.notificationsRepository.getDispatchSummaryCounts();
    const whatsappDevMode = parseBoolean(process.env.WHATSAPP_DEV_MODE ?? 'true');
    return {
      pendingCount: counts.pendingCount,
      sentToday: counts.sentToday,
      failedToday: counts.failedToday,
      simulatedToday: whatsappDevMode ? counts.whatsappSentToday : 0,
      whatsappEnabled: parseBoolean(process.env.WHATSAPP_ENABLED),
      whatsappDevMode,
      workerEnabled: parseBoolean(process.env.NOTIFICATION_WORKER_ENABLED)
    };
  }

  private getProvider(channel: string): NotificationProvider | null {
    if (channel === 'WHATSAPP') {
      return this.whatsAppProvider;
    }
    return null;
  }

  private getProviderSummary(summaries: Map<string, DispatchProviderSummary>, provider: NotificationProvider, channel: string): DispatchProviderSummary {
    const key = `${provider.constructor.name}:${channel}`;
    const existing = summaries.get(key);
    if (existing) return existing;
    const next = { provider: provider.constructor.name, channel, attempted: 0, sent: 0, failed: 0, simulated: 0 };
    summaries.set(key, next);
    return next;
  }

  private async markFailed(log: NotificationLog, reason: string): Promise<void> {
    await this.notificationsRepository.markLogStatus(log.businessId, log.id, { status: 'FAILED', failedReason: reason });
    this.logger.warn(`notificationId=${log.id} channel=${log.channel} failed reason=${reason}`);
  }
}
