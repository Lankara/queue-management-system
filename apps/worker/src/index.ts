interface DispatchResponse<T> {
  success?: boolean;
  data?: T;
}

interface DispatchResult {
  requested: number;
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  simulated: number;
  durationMs: number;
}

function parseBoolean(value: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes((value ?? '').toLowerCase());
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const apiBaseUrl = process.env.WORKER_API_BASE_URL ?? 'http://localhost:4000/api';
const accessToken = process.env.WORKER_API_ACCESS_TOKEN;
const workerEnabled = parseBoolean(process.env.NOTIFICATION_WORKER_ENABLED);
const pollIntervalMs = parsePositiveInteger(process.env.NOTIFICATION_WORKER_POLL_INTERVAL_MS, 15000);
const batchSize = parsePositiveInteger(process.env.NOTIFICATION_WORKER_BATCH_SIZE, 25);
const retryDelayMs = parsePositiveInteger(process.env.NOTIFICATION_WORKER_RETRY_DELAY_MS, 5000);
const heartbeatEveryPolls = parsePositiveInteger(process.env.NOTIFICATION_WORKER_HEARTBEAT_EVERY_POLLS, 10);
let pollCount = 0;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function dispatchPendingNotifications(): Promise<DispatchResult> {
  if (!accessToken) {
    throw new Error('WORKER_API_ACCESS_TOKEN is required for protected notification dispatch');
  }

  const response = await fetch(`${apiBaseUrl}/notifications/dispatch-pending`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ limit: batchSize })
  });

  const payload = (await response.json().catch(() => ({}))) as DispatchResponse<DispatchResult> | DispatchResult;
  if (!response.ok) {
    throw new Error(`Dispatch request failed with status ${response.status}`);
  }

  return 'data' in payload && payload.data ? payload.data : (payload as DispatchResult);
}

async function runOnce(): Promise<void> {
  const result = await dispatchPendingNotifications();
  console.log(`[notification-worker] processed=${result.processed} sent=${result.sent} failed=${result.failed} skipped=${result.skipped} simulated=${result.simulated} durationMs=${result.durationMs}`);
}

async function runLoop(): Promise<void> {
  console.log('[notification-worker] Queue Management notification worker');
  console.log(`[notification-worker] apiBaseUrl=${apiBaseUrl} intervalMs=${pollIntervalMs} retryDelayMs=${retryDelayMs} batchSize=${batchSize}`);
  while (true) {
    pollCount += 1;
    try {
      if (pollCount === 1 || pollCount % heartbeatEveryPolls === 0) {
        console.log(`[notification-worker] heartbeat poll=${pollCount}`);
      }
      await runOnce();
      await sleep(pollIntervalMs);
    } catch (error) {
      console.error('[notification-worker] dispatch failed', error instanceof Error ? error.message : error);
      await sleep(retryDelayMs);
    }
  }
}

if (workerEnabled) {
  void runLoop();
} else {
  console.log('[notification-worker] disabled. Set NOTIFICATION_WORKER_ENABLED=true to start polling.');
  setInterval(() => {
    console.log('[notification-worker] idle heartbeat');
  }, Math.max(pollIntervalMs, 60000));
}

