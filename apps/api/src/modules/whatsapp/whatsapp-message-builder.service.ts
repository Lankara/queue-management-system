import { Injectable } from '@nestjs/common';
import { WhatsAppLanguage } from './whatsapp-inbound.types';

export interface WhatsAppServiceOption {
  index: number;
  name: string;
}

@Injectable()
export class WhatsAppMessageBuilderService {
  welcome(language: WhatsAppLanguage): string {
    if (language === 'si') {
      return 'Queue Management වෙත සාදරයෙන් පිළිගනිමු.\n\n1 - පෝලිමට එකතු වන්න\n2 - Appointment එකක් වෙන් කරන්න\n3 - තත්ත්වය බලන්න\n4 - උදව්\n\nභාෂාව වෙනස් කිරීමට EN හෝ SI යවන්න.';
    }
    return 'Welcome to Queue Management.\n\n1 - Join Queue\n2 - Book Appointment\n3 - Check Status\n4 - Help\n\nSend EN or SI to change language.';
  }

  chooseLanguage(): string {
    return 'Choose language / භාෂාව තෝරන්න:\nEN - English\nSI - Sinhala';
  }

  help(language: WhatsAppLanguage): string {
    if (language === 'si') {
      return 'උදව්: 1 Queue, 2 Appointment, 3 Status, CANCEL අවලංගු කිරීම. මෙය සරල WhatsApp මෙනු සේවාවකි.';
    }
    return 'Help: send 1 for Queue, 2 for Appointment, 3 for Status, or CANCEL to cancel an appointment. This is a simple WhatsApp menu service.';
  }

  serviceList(language: WhatsAppLanguage, options: WhatsAppServiceOption[], purpose: 'queue' | 'appointment'): string {
    const heading = language === 'si'
      ? purpose === 'queue' ? 'සේවාව තෝරන්න:' : 'Appointment සේවාව තෝරන්න:'
      : purpose === 'queue' ? 'Choose a service for your queue:' : 'Choose a service for your appointment:';
    return `${heading}\n${options.map((option) => `${option.index} - ${option.name}`).join('\n')}`;
  }

  askAppointmentTime(language: WhatsAppLanguage): string {
    if (language === 'si') return 'කරුණාකර දිනය සහ වේලාව යවන්න. උදා: 2026-06-01 14:30';
    return 'Please send preferred date and time. Example: 2026-06-01 14:30';
  }

  queueJoined(language: WhatsAppLanguage, input: { queueNumber: string; position: number; serviceName: string; branchName?: string | null }): string {
    if (language === 'si') {
      return `ඔබ පෝලිමට එක්වී ඇත.\nඅංකය: ${input.queueNumber}\nස්ථානය: ${input.position}\nසේවාව: ${input.serviceName}${input.branchName ? `\nශාඛාව: ${input.branchName}` : ''}`;
    }
    return `You have joined the queue.\nNumber: ${input.queueNumber}\nPosition: ${input.position}\nService: ${input.serviceName}${input.branchName ? `\nBranch: ${input.branchName}` : ''}`;
  }

  appointmentRequested(language: WhatsAppLanguage, input: { serviceName: string; requestedTime: string }): string {
    if (language === 'si') return `Appointment ඉල්ලීම ලැබී ඇත.\nසේවාව: ${input.serviceName}\nවේලාව: ${input.requestedTime}\nතත්ත්වය: අනුමැතිය සඳහා රඳවා ඇත.`;
    return `Appointment request received.\nService: ${input.serviceName}\nTime: ${input.requestedTime}\nStatus: pending approval.`;
  }

  status(language: WhatsAppLanguage, message: string): string {
    return message;
  }

  cancelConfirm(language: WhatsAppLanguage): string {
    if (language === 'si') return 'නවතම appointment එක අවලංගු කිරීමට YES යවන්න. නැතිනම් NO යවන්න.';
    return 'Send YES to cancel your latest appointment. Send NO to keep it.';
  }

  cancelled(language: WhatsAppLanguage): string {
    if (language === 'si') return 'Appointment එක අවලංගු කරන ලදී.';
    return 'Appointment cancelled.';
  }

  invalidSelection(language: WhatsAppLanguage): string {
    if (language === 'si') return 'තෝරාගැනීම වැරදියි. කරුණාකර මෙනුවෙන් අංකයක් යවන්න.';
    return 'Invalid selection. Please send a number from the menu.';
  }

  unknown(language: WhatsAppLanguage): string {
    if (language === 'si') return 'මට එය තේරුම් ගත නොහැක. උදව් සඳහා HELP යවන්න.';
    return 'I did not understand that. Send HELP for options.';
  }

  comingSoon(language: WhatsAppLanguage): string {
    if (language === 'si') return 'මෙම පහසුකම ඉදිරියේදී WhatsApp තුළ සක්‍රීය වේ.';
    return 'This WhatsApp feature is coming soon.';
  }
}
