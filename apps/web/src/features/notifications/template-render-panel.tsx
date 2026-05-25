'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/ui/state';
import { NotificationTemplate } from '@/types/notification';
import { notificationChannelOptions, notificationLanguageOptions, templateKeyOptions } from './notification-options';
import { renderNotificationTemplate } from './notifications.api';

const schema = z.object({
  language: z.enum(['en', 'si']),
  channel: z.enum(['WEB', 'MOBILE_PUSH', 'WHATSAPP', 'SMS', 'EMAIL']),
  templateKey: z.enum(['QUEUE_CONFIRMED', 'QUEUE_POSITION_UPDATED', 'APPOINTMENT_PENDING_APPROVAL', 'APPOINTMENT_APPROVED', 'APPOINTMENT_REJECTED', 'APPOINTMENT_CANCELLED_BY_CUSTOMER', 'RESCHEDULE_PROPOSED', 'DELAY_NOTICE', 'NO_SHOW_WARNING', 'ONLINE_BOOKING_BANNED', 'BAN_RESET']),
  variablesJson: z.string().min(2)
});

export function TemplateRenderPanel({ businessId, template }: { businessId: string; template?: NotificationTemplate | null }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: { language: template?.language ?? 'en', channel: template?.channel ?? 'WHATSAPP', templateKey: template?.templateKey ?? 'QUEUE_CONFIRMED', variablesJson: '{\n  "customer_name": "Test Customer",\n  "business_name": "City Care",\n  "queue_number": "005"\n}' }
  });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => renderNotificationTemplate(businessId, { language: values.language, channel: values.channel, templateKey: values.templateKey, variables: JSON.parse(values.variablesJson) })
  });

  return (
    <div className="grid gap-4">
      {mutation.error ? <ErrorState message={mutation.error instanceof SyntaxError ? 'Variables must be valid JSON.' : 'Render failed.'} /> : null}
      <form className="grid gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-3">
          <Select label="Language" options={notificationLanguageOptions} error={errors.language?.message} {...register('language')} />
          <Select label="Channel" options={notificationChannelOptions} error={errors.channel?.message} {...register('channel')} />
          <Select label="Template key" options={templateKeyOptions} error={errors.templateKey?.message} {...register('templateKey')} />
        </div>
        <Textarea label="Variables JSON" error={errors.variablesJson?.message} {...register('variablesJson')} />
        <Button type="submit" isLoading={mutation.isPending}>Render template</Button>
      </form>
      {mutation.data ? <Card><p className="font-semibold">{mutation.data.title ?? 'No title'}</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{mutation.data.messageBody}</p></Card> : null}
    </div>
  );
}
