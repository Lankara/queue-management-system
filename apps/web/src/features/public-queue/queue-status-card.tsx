import { PublicQueueNumberDisplay } from './public-queue-number-display';
import { QueuePosition } from '@/types/queue';

function isBeingServed(position?: QueuePosition) {
  if (!position) return false;
  return position.status === 'CALLED' || position.status === 'IN_SERVICE' || Boolean(position.currentServingNumber && position.queueNumber === position.currentServingNumber);
}

function isNextInQueue(position?: QueuePosition) {
  if (!position || position.status === 'DRAFT' || isBeingServed(position)) return false;
  return position.position <= 2 || position.estimatedWaitingCount <= 1;
}

function getCustomerAlert(position?: QueuePosition) {
  if (!position) return null;
  if (position.status === 'DRAFT') {
    return { tone: 'bg-amber-50 text-amber-800 border-amber-200', title: 'Request sent', message: 'Please wait until staff approve your queue request.' };
  }
  if (isBeingServed(position)) {
    return { tone: 'bg-red-50 text-red-800 border-red-200 animate-pulse', title: "It's your turn now", message: 'Your number is being served. Please go to the counter or service area now.' };
  }
  if (isNextInQueue(position)) {
    return { tone: 'bg-orange-50 text-orange-800 border-orange-200 animate-pulse', title: 'Be Prepared', message: 'Your number is next or very close. Please stay nearby and watch the current ongoing number.' };
  }
  return null;
}

export function QueueStatusCard({ position }: { position?: QueuePosition }) {
  const alert = getCustomerAlert(position);
  const served = isBeingServed(position);
  const next = isNextInQueue(position);
  const numberVariant = served ? 'served' : next ? 'hot' : 'default';

  return (
    <div className="grid gap-3">
      {alert ? (
        <div className={`rounded-md border p-4 text-center ${alert.tone}`}>
          <p className="text-lg font-bold uppercase">{alert.title}</p>
          <p className="mt-1 text-sm font-medium">{alert.message}</p>
        </div>
      ) : null}
      <PublicQueueNumberDisplay label="Your Number" value={position?.queueNumber} variant={numberVariant} emphasis attention={served || next} />
      <PublicQueueNumberDisplay label="Current Ongoing Number" value={position?.currentServingNumber} variant="current" />
      <div className="grid gap-3 sm:grid-cols-3">
        <PublicQueueNumberDisplay label="Position" value={position?.position} />
        <PublicQueueNumberDisplay label="Waiting Count" value={position?.estimatedWaitingCount} />
        <PublicQueueNumberDisplay label="Total Numbers" value={position?.totalQueueCount} />
      </div>
    </div>
  );
}
