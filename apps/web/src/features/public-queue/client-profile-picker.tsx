'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicClientProfile } from '@/types/public-queue';

export function ClientProfilePicker({ profiles, selectedId, onSelect, onCreateNew }: { profiles: PublicClientProfile[]; selectedId?: string; onSelect: (profile: PublicClientProfile) => void; onCreateNew: () => void }) {
  return (
    <div className="grid gap-3">
      {profiles.map((profile) => <button key={profile.id} className={`rounded-md border bg-white p-4 text-left ${selectedId === profile.id ? 'border-teal-400 ring-1 ring-teal-200' : 'border-slate-200'}`} onClick={() => onSelect(profile)} type="button"><p className="font-semibold">{profile.fullName}</p><p className="text-sm text-slate-500">{profile.relationshipToContact ?? profile.gender}</p></button>)}
      {profiles.length === 0 ? <Card><p className="text-sm text-slate-600">No saved client profiles found.</p></Card> : null}
      <Button variant="secondary" onClick={onCreateNew}>Create new client profile</Button>
    </div>
  );
}

