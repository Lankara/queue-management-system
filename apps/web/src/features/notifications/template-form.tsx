'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { NotificationTemplate } from '@/types/notification';
import { notificationChannelOptions, notificationLanguageOptions, templateKeyOptions } from './notification-options';

const schema = z.object({
  language: z.enum(['en', 'si']),
  channel: z.enum(['WEB', 'MOBILE_PUSH', 'WHATSAPP', 'SMS', 'EMAIL']),
  templateKey: z.enum(['QUEUE_CONFIRMED', 'QUEUE_POSITION_UPDATED', 'APPOINTMENT_PENDING_APPROVAL', 'APPOINTMENT_APPROVED', 'APPOINTMENT_REJECTED', 'APPOINTMENT_CANCELLED_BY_CUSTOMER', 'RESCHEDULE_PROPOSED', 'DELAY_NOTICE', 'NO_SHOW_WARNING', 'ONLINE_BOOKING_BANNED', 'BAN_RESET']),
  title: z.string().optional(),
  messageBody: z.string().min(1, 'Message body is required'),
  isActive: z.boolean()
});

export type TemplateFormValues = z.infer<typeof schema>;

export function TemplateForm({ template, isSubmitting, onSubmit }: { template?: NotificationTemplate | null; isSubmitting?: boolean; onSubmit: (values: TemplateFormValues) => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TemplateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { language: 'en', channel: 'WHATSAPP', templateKey: 'QUEUE_CONFIRMED', title: '', messageBody: '', isActive: true }
  });

  useEffect(() => {
    if (template) {
      reset({ language: template.language, channel: template.channel, templateKey: template.templateKey, title: template.title ?? '', messageBody: template.messageBody, isActive: template.isActive });
    }
  }, [template, reset]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-3">
        <Select label="Language" options={notificationLanguageOptions} disabled={Boolean(template)} error={errors.language?.message} {...register('language')} />
        <Select label="Channel" options={notificationChannelOptions} disabled={Boolean(template)} error={errors.channel?.message} {...register('channel')} />
        <Select label="Template key" options={templateKeyOptions} disabled={Boolean(template)} error={errors.templateKey?.message} {...register('templateKey')} />
      </div>
      <Input label="Title" error={errors.title?.message} {...register('title')} />
      <Textarea label="Message body" error={errors.messageBody?.message} {...register('messageBody')} />
      <Checkbox label="Template is active" {...register('isActive')} />
      <Button type="submit" isLoading={isSubmitting}>{template ? 'Update template' : 'Create template'}</Button>
    </form>
  );
}
