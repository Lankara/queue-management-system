import { Injectable, Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
import { formatQueueNumber } from '../../common/utils/queue-number.util';
import { normalizePhone } from '../../common/utils/phone.util';
import { env } from '../../config/env';
import { DatabaseService } from '../../database/database.service';
import { NotificationPayload } from '../notifications/providers/notification-provider.interface';
import { WhatsAppCommandParserService } from './whatsapp-command-parser.service';
import { WhatsAppCommand, WhatsAppInboundMessage, WhatsAppLanguage, WhatsAppSessionState } from './whatsapp-inbound.types';
import { WhatsAppMessageBuilderService, WhatsAppServiceOption } from './whatsapp-message-builder.service';
import { WhatsAppProvider } from './whatsapp.provider';
import { WhatsAppSessionService } from './whatsapp-session.service';

type ServiceRow = { id: string; name: string; duration_minutes: number; branch_id: string | null; branch_name: string | null };
type BusinessRow = { id: string; slug: string; name: string; default_language: WhatsAppLanguage };
type CustomerRow = { id: string; primary_phone: string; is_online_booking_banned: boolean };
type ClientProfileRow = { id: string; full_name: string };
type QueueJoinResult = { queueEntryId: string; queueNumber: string; position: number; serviceName: string; branchName: string | null };
type AppointmentRequestResult = { appointmentId: string; serviceName: string; requestedTime: string };

export interface FlowReplyResult {
  reply: string;
  command: WhatsAppCommand;
  confidence: number;
  state: string;
  detectedLanguage?: WhatsAppLanguage;
  actionSummary?: Record<string, unknown>;
}

@Injectable()
export class WhatsAppCustomerFlowService {
  private readonly logger = new Logger(WhatsAppCustomerFlowService.name);
  private readonly lastHandledAt = new Map<string, number>();
  private readonly cooldownMs = 750;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly commandParser: WhatsAppCommandParserService,
    private readonly sessions: WhatsAppSessionService,
    private readonly messages: WhatsAppMessageBuilderService,
    private readonly whatsAppProvider: WhatsAppProvider
  ) {}

  async handleMessage(message: WhatsAppInboundMessage, options: { suppressSend?: boolean; ignoreCooldown?: boolean } = {}): Promise<FlowReplyResult> {
    const phone = message.fromPhone;
    if (!phone) {
      return { reply: this.messages.unknown('en'), command: 'UNKNOWN', confidence: 0, state: 'IDLE' };
    }

    if (!options.ignoreCooldown && this.isCoolingDown(phone)) {
      const session = this.sessions.getSession(phone);
      return { reply: session.language === 'si' ? 'කරුණාකර මොහොතක් රැඳී සිටින්න.' : 'Please wait a moment before sending again.', command: 'UNKNOWN', confidence: 0, state: session.step ?? 'IDLE' };
    }

    const rawText = message.textBody ?? message.buttonReply ?? message.listReply ?? '';
    const command = this.commandParser.parse(rawText);
    const session = this.sessions.getSession(phone);
    const language = this.resolveLanguage(rawText, session);
    let reply: string;

    if (language !== session.language) {
      this.sessions.updateSession(phone, { language, step: 'WAITING_FOR_ACTION', currentIntent: 'HELP', businessSlug: this.defaultBusinessSlug() });
      reply = this.messages.welcome(language);
      await this.maybeSendReply(phone, reply, options.suppressSend);
      return { reply, command: 'HELP', confidence: 1, state: 'WAITING_FOR_ACTION', detectedLanguage: language };
    }

    const activeSession = this.sessions.updateSession(phone, { language, businessSlug: this.defaultBusinessSlug() });

    if (!activeSession.language) {
      reply = this.messages.chooseLanguage();
      this.sessions.updateSession(phone, { step: 'WAITING_FOR_LANGUAGE' });
      await this.maybeSendReply(phone, reply, options.suppressSend);
      return { reply, command: 'HELP', confidence: 1, state: 'WAITING_FOR_LANGUAGE', detectedLanguage: language };
    }

    try {
      reply = await this.routeMessage(activeSession, message, rawText, command.command);
    } catch (error) {
      this.logger.warn(`WhatsApp customer flow failed command=${command.command} reason=${error instanceof Error ? error.message : 'unknown'}`);
      reply = activeSession.language === 'si' ? 'කණගාටුයි, ඉල්ලීම සම්පූර්ණ කළ නොහැක. නැවත උත්සාහ කරන්න.' : 'Sorry, I could not complete that request. Please try again.';
    }

    const updated = this.sessions.getSession(phone);
    await this.maybeSendReply(phone, reply, options.suppressSend);
    return { reply, command: command.command, confidence: command.confidence, state: updated.step ?? 'IDLE', detectedLanguage: updated.language, actionSummary: updated.data.lastAction as Record<string, unknown> | undefined };
  }

  private async routeMessage(session: WhatsAppSessionState, message: WhatsAppInboundMessage, rawText: string, command: WhatsAppCommand): Promise<string> {
    const language = session.language ?? 'en';
    const normalized = rawText.trim().toLowerCase();

    if (command === 'HI' || normalized === 'start') {
      this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_ACTION', currentIntent: 'HELP' });
      return this.messages.welcome(language);
    }

    if (command === 'HELP' || normalized === '4') {
      this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_ACTION', currentIntent: 'HELP' });
      return this.messages.help(language);
    }

    if (session.step === 'WAITING_FOR_QUEUE_SERVICE') {
      return this.handleQueueServiceSelection(session, normalized, message.profileName);
    }

    if (session.step === 'WAITING_FOR_APPOINTMENT_SERVICE') {
      return this.handleAppointmentServiceSelection(session, normalized);
    }

    if (session.step === 'WAITING_FOR_APPOINTMENT_TIME') {
      return this.handleAppointmentTime(session, rawText, message.profileName);
    }

    if (session.step === 'WAITING_FOR_CANCEL_CONFIRMATION') {
      return this.handleCancelConfirmation(session, normalized);
    }

    if (command === 'JOIN_QUEUE' || normalized === '1') {
      const services = await this.findServicesForDefaultBusiness();
      this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_QUEUE_SERVICE', currentIntent: 'JOIN_QUEUE', data: { services } });
      return this.messages.serviceList(language, this.toServiceOptions(services), 'queue');
    }

    if (command === 'BOOK_APPOINTMENT' || normalized === '2') {
      const services = await this.findServicesForDefaultBusiness();
      this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_APPOINTMENT_SERVICE', currentIntent: 'BOOK_APPOINTMENT', data: { services } });
      return this.messages.serviceList(language, this.toServiceOptions(services), 'appointment');
    }

    if (command === 'CHECK_STATUS' || normalized === '3') {
      this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_ACTION', currentIntent: 'CHECK_STATUS' });
      return this.buildStatusReply(session);
    }

    if (command === 'CANCEL') {
      this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_CANCEL_CONFIRMATION', currentIntent: 'CANCEL' });
      return this.messages.cancelConfirm(language);
    }

    return this.messages.unknown(language);
  }

  private async handleQueueServiceSelection(session: WhatsAppSessionState, text: string, profileName: string | null): Promise<string> {
    const language = session.language ?? 'en';
    const service = this.pickService(session, text);
    if (!service) return this.messages.invalidSelection(language);

    const business = await this.resolveDefaultBusiness();
    const identity = await this.ensureCustomerAndProfile(business, session.phone, language, profileName);
    if (identity.customer.is_online_booking_banned) {
      return language === 'si' ? 'ඔබට online booking අවසර නැත. කරුණාකර counter එක අමතන්න.' : 'Online booking is currently blocked for this phone. Please contact the counter.';
    }
    const joined = await this.createAndConfirmQueueEntry(business.id, service, identity.customer.id, identity.profile.id);
    this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_ACTION', currentIntent: 'JOIN_QUEUE', customerId: identity.customer.id, clientProfileId: identity.profile.id, data: { latestQueueEntryId: joined.queueEntryId, lastAction: { type: 'QUEUE_CREATED', queueEntryId: joined.queueEntryId, queueNumber: joined.queueNumber, status: 'CONFIRMED', position: joined.position } } });
    return this.messages.queueJoined(language, joined);
  }

  private async handleAppointmentServiceSelection(session: WhatsAppSessionState, text: string): Promise<string> {
    const language = session.language ?? 'en';
    const service = this.pickService(session, text);
    if (!service) return this.messages.invalidSelection(language);
    this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_APPOINTMENT_TIME', currentIntent: 'BOOK_APPOINTMENT', data: { selectedService: service } });
    return this.messages.askAppointmentTime(language);
  }

  private async handleAppointmentTime(session: WhatsAppSessionState, rawText: string, profileName: string | null): Promise<string> {
    const language = session.language ?? 'en';
    const service = session.data.selectedService as ServiceRow | undefined;
    if (!service) {
      this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_ACTION' });
      return this.messages.unknown(language);
    }
    const start = this.parseAppointmentDateTime(rawText);
    if (!start) return this.messages.askAppointmentTime(language);

    const business = await this.resolveDefaultBusiness();
    const identity = await this.ensureCustomerAndProfile(business, session.phone, language, profileName);
    if (identity.customer.is_online_booking_banned) {
      return language === 'si' ? 'ඔබට online booking අවසර නැත. කරුණාකර counter එක අමතන්න.' : 'Online booking is currently blocked for this phone. Please contact the counter.';
    }
    const appointment = await this.createAppointmentRequest(business.id, service, identity.customer.id, identity.profile.id, start);
    this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_ACTION', currentIntent: 'BOOK_APPOINTMENT', customerId: identity.customer.id, clientProfileId: identity.profile.id, data: { latestAppointmentId: appointment.appointmentId, lastAction: { type: 'APPOINTMENT_CREATED', appointmentId: appointment.appointmentId, status: 'PENDING_APPROVAL', requestedTime: appointment.requestedTime } } });
    return this.messages.appointmentRequested(language, appointment);
  }

  private async handleCancelConfirmation(session: WhatsAppSessionState, text: string): Promise<string> {
    const language = session.language ?? 'en';
    if (!['yes', 'y', 'ඔව්'].includes(text)) {
      this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_ACTION' });
      return this.messages.welcome(language);
    }
    const business = await this.resolveDefaultBusiness();
    const customer = await this.findCustomerByPhone(business.id, session.phone);
    if (!customer) return language === 'si' ? 'අවලංගු කිරීමට appointment එකක් නොමැත.' : 'No appointment found to cancel.';
    const cancelled = await this.cancelLatestAppointment(business.id, customer.id);
    this.sessions.updateSession(session.phone, { step: 'WAITING_FOR_ACTION' });
    return cancelled ? this.messages.cancelled(language) : language === 'si' ? 'අවලංගු කිරීමට appointment එකක් නොමැත.' : 'No cancellable appointment found.';
  }

  private async buildStatusReply(session: WhatsAppSessionState): Promise<string> {
    const language = session.language ?? 'en';
    const business = await this.resolveDefaultBusiness();
    const customer = await this.findCustomerByPhone(business.id, session.phone);
    if (!customer) return language === 'si' ? 'සක්‍රීය පෝලිමක් හෝ appointment එකක් නොමැත.' : 'No active queue or appointment found.';

    const queue = await this.findLatestQueueStatus(business.id, customer.id);
    if (queue) {
      if (language === 'si') return `පෝලිම් අංකය: ${queue.queue_number}\nතත්ත්වය: ${queue.status}\nස්ථානය: ${queue.position}\nදැන් සේවාව: ${queue.current_number ?? 'ආරම්භ කර නැත'}`;
      return `Queue number: ${queue.queue_number}\nStatus: ${queue.status}\nPosition: ${queue.position}\nNow serving: ${queue.current_number ?? 'Not started'}`;
    }

    const appointment = await this.findLatestAppointmentStatus(business.id, customer.id);
    if (appointment) {
      if (language === 'si') return `Appointment තත්ත්වය: ${appointment.status}\nවේලාව: ${new Date(appointment.requested_start_time).toLocaleString()}${appointment.queue_number ? `\nQueue: ${appointment.queue_number}` : ''}`;
      return `Appointment status: ${appointment.status}\nTime: ${new Date(appointment.requested_start_time).toLocaleString()}${appointment.queue_number ? `\nQueue: ${appointment.queue_number}` : ''}`;
    }

    return language === 'si' ? 'සක්‍රීය පෝලිමක් හෝ appointment එකක් නොමැත.' : 'No active queue or appointment found.';
  }

  private async maybeSendReply(phone: string, reply: string, suppressSend = false): Promise<void> {
    if (suppressSend || env.whatsappInboundDevMode || !env.whatsappEnabled) {
      this.logger.log(`WhatsApp MVP reply preview to=${this.maskPhone(phone)} state=${this.sessions.getSession(phone).step ?? 'IDLE'}`);
      return;
    }
    const payload: NotificationPayload = { notificationId: `inbound-reply-${Date.now()}`, businessId: 'whatsapp-inbound', channel: 'WHATSAPP', recipient: phone, messageBody: reply };
    const result = await this.whatsAppProvider.send(payload);
    if (!result.success) this.logger.warn(`WhatsApp MVP reply send failed reason=${result.errorMessage ?? 'unknown'}`);
  }

  private resolveLanguage(text: string, session: WhatsAppSessionState): WhatsAppLanguage {
    const normalized = text.trim().toLowerCase();
    if (normalized === 'en' || normalized === 'english') return 'en';
    if (normalized === 'si' || normalized === 'sinhala') return 'si';
    return session.language ?? 'en';
  }

  private async resolveDefaultBusiness(): Promise<BusinessRow> {
    const slug = this.defaultBusinessSlug();
    const result = await this.databaseService.query<BusinessRow>(`SELECT id, slug, name, default_language FROM businesses WHERE slug = $1 AND is_active = true LIMIT 1`, [slug]);
    if (!result.rows[0]) throw new Error(`Default WhatsApp business not found: ${slug}`);
    return result.rows[0];
  }

  private defaultBusinessSlug(): string {
    return env.whatsappDefaultBusinessSlug ?? 'city-care-medical';
  }

  private async findServicesForDefaultBusiness(): Promise<ServiceRow[]> {
    const business = await this.resolveDefaultBusiness();
    const result = await this.databaseService.query<ServiceRow>(
      `SELECT s.id, s.name, s.duration_minutes, s.branch_id, b.name AS branch_name
       FROM services s
       LEFT JOIN branches b ON b.id = s.branch_id
       WHERE s.business_id = $1 AND s.is_active = true
       ORDER BY s.name ASC`,
      [business.id]
    );
    return result.rows;
  }

  private toServiceOptions(services: ServiceRow[]): WhatsAppServiceOption[] {
    return services.map((service, index) => ({ index: index + 1, name: service.branch_name ? `${service.name} (${service.branch_name})` : service.name }));
  }

  private pickService(session: WhatsAppSessionState, text: string): ServiceRow | null {
    const services = (session.data.services ?? []) as ServiceRow[];
    const index = Number(text);
    if (!Number.isInteger(index) || index < 1 || index > services.length) return null;
    return services[index - 1];
  }

  private async ensureCustomerAndProfile(business: BusinessRow, phone: string, language: WhatsAppLanguage, profileName: string | null): Promise<{ customer: CustomerRow; profile: ClientProfileRow }> {
    let customer = await this.findCustomerByPhone(business.id, phone);
    if (!customer) {
      const primaryPhone = this.formatPhoneForStorage(phone);
      const created = await this.databaseService.query<CustomerRow>(
        `INSERT INTO customers (business_id, primary_phone, preferred_language)
         VALUES ($1, $2, $3)
         ON CONFLICT (business_id, primary_phone) DO UPDATE SET preferred_language = EXCLUDED.preferred_language
         RETURNING id, primary_phone, is_online_booking_banned`,
        [business.id, primaryPhone, language]
      );
      customer = created.rows[0];
    }

    const profiles = await this.databaseService.query<ClientProfileRow>(`SELECT id, full_name FROM client_profiles WHERE business_id = $1 AND customer_id = $2 ORDER BY created_at ASC LIMIT 1`, [business.id, customer.id]);
    let profile = profiles.rows[0];
    if (!profile) {
      const createdProfile = await this.databaseService.query<ClientProfileRow>(
        `INSERT INTO client_profiles (business_id, customer_id, full_name, relationship_to_contact)
         VALUES ($1, $2, $3, 'Self')
         RETURNING id, full_name`,
        [business.id, customer.id, profileName?.trim() || 'WhatsApp Customer']
      );
      profile = createdProfile.rows[0];
    }

    return { customer, profile };
  }

  private async findCustomerByPhone(businessId: string, phone: string): Promise<CustomerRow | null> {
    const normalized = normalizePhone(phone).replace(/^\+/, '');
    const candidates = Array.from(new Set([phone, `+${normalized}`, normalized, normalized.startsWith('94') ? `0${normalized.slice(2)}` : normalized]));
    const result = await this.databaseService.query<CustomerRow>(
      `SELECT id, primary_phone, is_online_booking_banned
       FROM customers
       WHERE business_id = $1 AND primary_phone = ANY($2::text[])
       LIMIT 1`,
      [businessId, candidates]
    );
    return result.rows[0] ?? null;
  }

  private formatPhoneForStorage(phone: string): string {
    const normalized = normalizePhone(phone).replace(/^\+/, '');
    return `+${normalized}`;
  }

  private async createAndConfirmQueueEntry(businessId: string, service: ServiceRow, customerId: string, clientProfileId: string): Promise<QueueJoinResult> {
    const client = await this.databaseService.getPool().connect();
    try {
      await client.query('BEGIN');
      const settings = await client.query<{ queue_number_length: number }>(`SELECT queue_number_length FROM business_profile_settings WHERE business_id = $1 LIMIT 1`, [businessId]);
      const queueNumberLength = settings.rows[0]?.queue_number_length ?? 3;
      const queueDate = (await client.query<{ today: string }>(`SELECT CURRENT_DATE::text AS today`)).rows[0].today;
      const queueCode = `WA-${service.branch_id?.slice(0, 8) ?? 'ALL'}-${service.id.slice(0, 8)}`;
      const queue = await this.getOrCreateQueue(client, businessId, service, queueDate, queueCode);
      const nextSequence = queue.last_issued_number + 1;
      const queueNumber = formatQueueNumber(nextSequence, queueNumberLength);
      await client.query(`UPDATE queues SET last_issued_number = $2, updated_at = now() WHERE id = $1`, [queue.id, nextSequence]);
      const entry = await client.query<{ id: string }>(
        `INSERT INTO queue_entries (business_id, queue_id, branch_id, service_id, customer_id, client_profile_id, queue_number, queue_sequence, status, source, service_date, confirmed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CONFIRMED', 'WHATSAPP', $9, now())
         RETURNING id`,
        [businessId, queue.id, service.branch_id, service.id, customerId, clientProfileId, queueNumber, nextSequence, queueDate]
      );
      await client.query('COMMIT');
      const position = await this.calculateQueuePosition(businessId, entry.rows[0].id);
      return { queueEntryId: entry.rows[0].id, queueNumber, position, serviceName: service.name, branchName: service.branch_name };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private async getOrCreateQueue(client: PoolClient, businessId: string, service: ServiceRow, queueDate: string, code: string): Promise<{ id: string; last_issued_number: number }> {
    const existing = await client.query<{ id: string; last_issued_number: number }>(
      `SELECT id, last_issued_number FROM queues WHERE business_id = $1 AND code = $2 AND queue_date = $3 FOR UPDATE`,
      [businessId, code, queueDate]
    );
    if (existing.rows[0]) return existing.rows[0];
    const created = await client.query<{ id: string; last_issued_number: number }>(
      `INSERT INTO queues (business_id, branch_id, service_id, queue_date, code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, last_issued_number`,
      [businessId, service.branch_id, service.id, queueDate, code]
    );
    return created.rows[0];
  }

  private async calculateQueuePosition(businessId: string, queueEntryId: string): Promise<number> {
    const result = await this.databaseService.query<{ position: string }>(
      `SELECT COUNT(*) + 1 AS position
       FROM queue_entries before_entry
       JOIN queue_entries selected ON selected.business_id = before_entry.business_id AND selected.queue_id = before_entry.queue_id
       WHERE selected.business_id = $1
         AND selected.id = $2
         AND before_entry.queue_sequence < selected.queue_sequence
         AND before_entry.status IN ('CONFIRMED', 'WAITING', 'CALLED', 'IN_SERVICE')`,
      [businessId, queueEntryId]
    );
    return Number(result.rows[0]?.position ?? 1);
  }

  private parseAppointmentDateTime(raw: string): Date | null {
    const match = raw.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})$/);
    if (!match) return null;
    const date = new Date(`${match[1]}T${match[2]}:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private async createAppointmentRequest(businessId: string, service: ServiceRow, customerId: string, clientProfileId: string, start: Date): Promise<AppointmentRequestResult> {
    const end = new Date(start.getTime() + (service.duration_minutes || 15) * 60_000);
    const result = await this.databaseService.query<{ id: string }>(
      `INSERT INTO appointments (business_id, branch_id, service_id, customer_id, client_profile_id, requested_start_time, requested_end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING_APPROVAL')
       RETURNING id`,
      [businessId, service.branch_id, service.id, customerId, clientProfileId, start.toISOString(), end.toISOString()]
    );
    return { appointmentId: result.rows[0].id, serviceName: service.name, requestedTime: start.toLocaleString() };
  }

  private async findLatestQueueStatus(businessId: string, customerId: string): Promise<{ queue_number: string; status: string; current_number: string | null; position: number } | null> {
    const result = await this.databaseService.query<{ id: string; queue_number: string; status: string; current_number: string | null }>(
      `SELECT qe.id, qe.queue_number, qe.status, q.current_number
       FROM queue_entries qe
       JOIN queues q ON q.id = qe.queue_id
       WHERE qe.business_id = $1 AND qe.customer_id = $2 AND qe.status IN ('CONFIRMED', 'WAITING', 'CALLED', 'IN_SERVICE')
       ORDER BY qe.created_at DESC
       LIMIT 1`,
      [businessId, customerId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return { ...row, position: await this.calculateQueuePosition(businessId, row.id) };
  }

  private async findLatestAppointmentStatus(businessId: string, customerId: string): Promise<{ status: string; requested_start_time: Date; queue_number: string | null } | null> {
    const result = await this.databaseService.query<{ status: string; requested_start_time: Date; queue_number: string | null }>(
      `SELECT a.status, a.requested_start_time, qe.queue_number
       FROM appointments a
       LEFT JOIN queue_entries qe ON qe.id = a.queue_entry_id
       WHERE a.business_id = $1 AND a.customer_id = $2 AND a.status NOT IN ('COMPLETED', 'NO_SHOW', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OPERATOR')
       ORDER BY a.created_at DESC
       LIMIT 1`,
      [businessId, customerId]
    );
    return result.rows[0] ?? null;
  }

  private async cancelLatestAppointment(businessId: string, customerId: string): Promise<boolean> {
    const appointment = await this.databaseService.query<{ id: string; queue_entry_id: string | null }>(
      `SELECT id, queue_entry_id FROM appointments
       WHERE business_id = $1 AND customer_id = $2 AND status IN ('PENDING_APPROVAL', 'APPROVED', 'RESCHEDULE_PROPOSED', 'RESCHEDULE_ACCEPTED')
       ORDER BY created_at DESC LIMIT 1`,
      [businessId, customerId]
    );
    const row = appointment.rows[0];
    if (!row) return false;
    await this.databaseService.query(`UPDATE appointments SET status = 'CANCELLED_BY_CUSTOMER', cancelled_at = now(), cancellation_reason = 'Cancelled through WhatsApp', updated_at = now() WHERE business_id = $1 AND id = $2`, [businessId, row.id]);
    if (row.queue_entry_id) {
      await this.databaseService.query(`UPDATE queue_entries SET status = 'CANCELLED', cancelled_at = now(), updated_at = now() WHERE business_id = $1 AND id = $2 AND status NOT IN ('COMPLETED', 'NO_SHOW')`, [businessId, row.queue_entry_id]);
    }
    return true;
  }

  private isCoolingDown(phone: string): boolean {
    const now = Date.now();
    const previous = this.lastHandledAt.get(phone) ?? 0;
    this.lastHandledAt.set(phone, now);
    return now - previous < this.cooldownMs;
  }

  private maskPhone(phone: string): string {
    return phone.length <= 4 ? '****' : `${phone.slice(0, 2)}***${phone.slice(-2)}`;
  }
}



