import { PublicQueueNumberDisplay } from './public-queue-number-display';
import { QueuePosition } from '@/types/queue';

export function QueueStatusCard({ position }: { position?: QueuePosition }) {
  return (
    <div className="grid gap-3">
      <PublicQueueNumberDisplay label="Now Serving" value={position?.currentServingNumber} />
      <PublicQueueNumberDisplay label="Your Number" value={position?.queueNumber} />
      <PublicQueueNumberDisplay label="Position" value={position?.position} />
      <PublicQueueNumberDisplay label="Waiting Count" value={position?.estimatedWaitingCount} />
    </div>
  );
}
