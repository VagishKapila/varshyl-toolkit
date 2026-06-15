/**
 * Dead-simple storage for the reference adapter. In-memory by default; this is
 * the EXAMPLE backing store, not a product database. A real product adapter
 * talks to its own authenticated back-end instead.
 */
export interface SorenRecord {
  id: string;
  type: string;
  title: string;
  createdAt: number;
  fields?: Record<string, unknown>;
  thumbnailUrl?: string;
}

export interface SorenStore {
  all(): SorenRecord[];
  byType(type: string): SorenRecord[];
  get(id: string): SorenRecord | undefined;
  insert(rec: Omit<SorenRecord, 'id'> & { id?: string }): SorenRecord;
  remove(id: string): boolean;
  query(text: string): SorenRecord[];
}

let idSeq = 0;
function makeId(type: string): string {
  idSeq += 1;
  return `${type}_${Date.now().toString(36)}_${idSeq}`;
}

export class SorenMemoryStore implements SorenStore {
  private records = new Map<string, SorenRecord>();

  constructor(seed: ReadonlyArray<Omit<SorenRecord, 'id'> & { id?: string }> = []) {
    seed.forEach((r) => this.insert(r));
  }

  all(): SorenRecord[] {
    return [...this.records.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  byType(type: string): SorenRecord[] {
    return this.all().filter((r) => r.type === type);
  }

  get(id: string): SorenRecord | undefined {
    return this.records.get(id);
  }

  insert(rec: Omit<SorenRecord, 'id'> & { id?: string }): SorenRecord {
    const id = rec.id ?? makeId(rec.type);
    const full: SorenRecord = { ...rec, id };
    this.records.set(id, full);
    return full;
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  query(text: string): SorenRecord[] {
    const needle = text.trim().toLowerCase();
    if (!needle) return [];
    return this.all().filter(
      (r) => r.title.toLowerCase().includes(needle) || r.type.toLowerCase().includes(needle),
    );
  }
}

const DAY = 24 * 60 * 60 * 1000;

/** Seed store with believable JobSite-style data so the demo feels alive. */
export function seedReferenceStore(now: Date = new Date()): SorenMemoryStore {
  const t = now.getTime();
  const startOfToday = new Date(now);
  startOfToday.setHours(8, 0, 0, 0);
  const today = startOfToday.getTime();
  return new SorenMemoryStore([
    { type: 'project', title: 'Maple Street Foundation', createdAt: t - 30 * DAY },
    { type: 'project', title: 'Riverside Deck Rebuild', createdAt: t - 12 * DAY },
    { type: 'photo', title: 'Footing rebar — north corner', createdAt: today + 1 * 3600_000 },
    { type: 'photo', title: 'Concrete pour in progress', createdAt: today + 2 * 3600_000 },
    { type: 'photo', title: 'Site delivery — lumber', createdAt: today + 3 * 3600_000 },
    { type: 'photo', title: 'Yesterday inspection shot', createdAt: t - 1 * DAY },
    { type: 'note', title: 'Inspector confirmed Friday', createdAt: today + 90 * 60_000 },
    { type: 'log', title: 'Daily log — yesterday', createdAt: t - 1 * DAY },
  ]);
}
