import Dexie, { Table } from 'dexie';
import type { Farmer, MilkDelivery, LedgerEntry, SyncQueueItem } from '@/types';

export interface LocalFarmer extends Farmer {
  synced?: boolean;
}

export interface LocalMilkDelivery extends MilkDelivery {
  synced?: boolean;
}

export interface LocalLedgerEntry extends LedgerEntry {
  synced?: boolean;
}

export class MilkyDB extends Dexie {
  farmers!: Table<LocalFarmer>;
  deliveries!: Table<LocalMilkDelivery>;
  ledger!: Table<LocalLedgerEntry>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('MilkyDB');
    this.version(1).stores({
      farmers: 'id, name, phone, active, evening_delivery_enabled, archived_at, synced',
      deliveries: 'id, farmer_id, date, synced',
      ledger: 'id, farmer_id, transaction_date, synced',
      syncQueue: 'id, created_at, synced_at',
    });
  }
}

export const db = new MilkyDB();

// Offline utilities
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'created_at'>) {
  return db.syncQueue.add({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    created_at: new Date().toISOString(),
    synced_at: null,
  });
}

export async function getPendingSyncItems() {
  return db.syncQueue.where('synced_at').equals(null as any).toArray();
}

export async function markSyncItemAsSynced(id: string) {
  return db.syncQueue.update(id, {
    synced_at: new Date().toISOString(),
  });
}

export async function clearSyncedItems() {
  return db.syncQueue.where('synced_at').notEqual(null as any).delete();
}

// Local farmer utilities
export async function saveLocalFarmer(farmer: LocalFarmer) {
  return db.farmers.put(farmer);
}

export async function getLocalFarmers() {
  return db.farmers.where('archived_at').equals(null as any).toArray();
}

// Local delivery utilities
export async function saveLocalDelivery(delivery: LocalMilkDelivery) {
  return db.deliveries.put(delivery);
}

export async function getLocalDeliveries(date: string) {
  return db.deliveries.where('date').equals(date).toArray();
}

export async function getUnsyncedDeliveries() {
  return db.deliveries.where('synced').equals(false as any).toArray();
}

// Local ledger utilities
export async function saveLocalLedgerEntry(entry: LocalLedgerEntry) {
  return db.ledger.put(entry);
}

