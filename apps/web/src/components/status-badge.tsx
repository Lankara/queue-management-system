import { Badge } from './ui/badge';

export function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
  return <Badge tone={active ? 'green' : 'red'}>{active ? activeLabel : inactiveLabel}</Badge>;
}
