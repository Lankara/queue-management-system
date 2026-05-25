'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { SectionCard } from '@/components/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { clearWhatsAppSession, getSupportedCommands, getWhatsAppSession, simulateWhatsAppMessage } from '@/features/whatsapp/whatsapp-simulator.api';
import { WhatsAppConversationMessage, WhatsAppSimulatorResponse } from '@/types/whatsapp';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

const quickActions = [
  'Hi',
  'Help',
  'Queue',
  'Appointment',
  'Status',
  'Cancel',
  'SI',
  'ආයුබෝවන්',
  'YES'
];

export default function WhatsAppSimulatorPage() {
  const [phone, setPhone] = useState('+94771234567');
  const [profileName, setProfileName] = useState('Test Patient');
  const [message, setMessage] = useState('Hi');
  const [history, setHistory] = useState<WhatsAppConversationMessage[]>([]);
  const [lastResult, setLastResult] = useState<WhatsAppSimulatorResponse | null>(null);
  const sessionQuery = useQuery({ queryKey: ['whatsapp-session', phone], queryFn: () => getWhatsAppSession(phone), enabled: Boolean(phone) });
  const commandsQuery = useQuery({ queryKey: ['whatsapp-supported-commands'], queryFn: getSupportedCommands });

  const simulateMutation = useMutation({
    mutationFn: (text: string) => simulateWhatsAppMessage({ phone, text, profileName }),
    onSuccess: (result, text) => {
      const now = new Date().toISOString();
      setHistory((current) => [
        ...current,
        { id: `${now}-in`, direction: 'inbound', text, timestamp: now, language: result.detectedLanguage },
        { id: `${now}-out`, direction: 'outbound', text: result.generatedReply, timestamp: new Date().toISOString(), language: result.detectedLanguage }
      ]);
      setLastResult(result);
      sessionQuery.refetch();
      setMessage('');
    }
  });

  const clearMutation = useMutation({
    mutationFn: () => clearWhatsAppSession(phone),
    onSuccess: () => {
      setHistory([]);
      setLastResult(null);
      sessionQuery.refetch();
    }
  });

  const sendMessage = (text = message) => {
    if (!phone || !text.trim()) return;
    simulateMutation.mutate(text.trim());
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="WhatsApp Simulator" description="Test deterministic WhatsApp customer flows without Meta or ngrok." />
      <Card className="border-amber-200 bg-amber-50 text-sm text-amber-800">Simulator only. No real WhatsApp messages are sent.</Card>
      {[simulateMutation.error, clearMutation.error, sessionQuery.error, commandsQuery.error].filter(Boolean).map((error, index) => <ErrorState key={index} message={getErrorMessage(error)} />)}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-6">
          <SectionCard title="Simulator controls" description="Use the same phone number to keep testing one in-memory session.">
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <Input label="Profile name" value={profileName} onChange={(event) => setProfileName(event.target.value)} />
            </div>
            <div className="mt-4 grid gap-3">
              <Textarea label="Inbound message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type Hi, Queue, Appointment, Status..." />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => sendMessage()} isLoading={simulateMutation.isPending}><Send className="h-4 w-4" /> Send</Button>
                <Button variant="secondary" onClick={() => clearMutation.mutate()} isLoading={clearMutation.isPending}><Trash2 className="h-4 w-4" /> Reset Session</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => <Button key={action} type="button" variant="secondary" onClick={() => sendMessage(action)}>{action}</Button>)}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Conversation preview" description="Frontend-only chat history for this simulator page.">
            <div className="grid gap-3">
              {history.length === 0 ? <EmptyState title="No simulated messages yet" /> : null}
              {history.map((item) => (
                <div key={item.id} className={item.direction === 'inbound' ? 'justify-self-end rounded-md bg-teal-700 p-3 text-white' : 'justify-self-start rounded-md bg-slate-100 p-3 text-slate-900'}>
                  <div className="mb-1 flex items-center gap-2 text-xs opacity-80"><span>{item.direction === 'inbound' ? 'Customer' : 'System'}</span>{item.language ? <span>{item.language}</span> : null}<span>{new Date(item.timestamp).toLocaleTimeString()}</span></div>
                  <pre className="whitespace-pre-wrap font-sans text-sm">{item.text}</pre>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6">
          <SectionCard title="Session inspector" description="Current in-memory WhatsApp session state.">
            {sessionQuery.isLoading ? <LoadingState message="Loading session..." /> : null}
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge>{sessionQuery.data?.session?.step ?? 'No state'}</Badge>
              <Badge tone="teal">{sessionQuery.data?.session?.language ?? 'no language'}</Badge>
              <Badge>{sessionQuery.data?.session?.currentIntent ?? 'no intent'}</Badge>
            </div>
            <pre className="max-h-[420px] overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-50">{JSON.stringify(sessionQuery.data?.session ?? null, null, 2)}</pre>
          </SectionCard>

          <SectionCard title="Last result" description="Command and action summary from the last simulated message.">
            {!lastResult ? <EmptyState title="No result yet" /> : <pre className="max-h-[320px] overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-50">{JSON.stringify(lastResult, null, 2)}</pre>}
          </SectionCard>

          <SectionCard title="Supported commands" description="Deterministic intents currently recognized.">
            {commandsQuery.isLoading ? <LoadingState message="Loading commands..." /> : null}
            <div className="grid gap-2">
              {commandsQuery.data?.intents.map((intent) => (
                <div key={intent.command} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="font-medium text-slate-950">{intent.command}</div>
                  <div className="text-slate-600">{intent.description}</div>
                  <div className="mt-1 text-xs text-slate-500">{intent.samples.join(', ')}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
