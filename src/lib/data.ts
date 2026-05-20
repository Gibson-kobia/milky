import { supabase } from '@/lib/supabase/client';
import {
  addToSyncQueue,
  db,
  getLocalFarmers,
  getLocalDeliveries,
  saveLocalDelivery,
  saveLocalFarmer,
  markSyncItemAsSynced,
  getPendingSyncItems,
  type LocalFarmer,
  type LocalMilkDelivery,
} from '@/lib/db/indexeddb';
import { generateId } from '@/lib/utils';
import type { Farmer, MilkDelivery } from '@/types';

export const isBrowser = () => typeof window !== 'undefined';

export const isOnline = () => isBrowser() && window.navigator.onLine;
export async function getStoredPinHash(): Promise<string | null> {
  console.log('[DEBUG-MILKY] getStoredPinHash() start');
  if (isBrowser()) {
    const localHash = localStorage.getItem('pin_hash');
    console.log('[DEBUG-MILKY] getStoredPinHash localStorage hash found', {
      hasLocalHash: Boolean(localHash),
    });
    if (localHash) {
      return localHash;
    }
  }

  if (!supabase) {
    console.warn('[DEBUG-MILKY] getStoredPinHash supabase unavailable');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('pin_hash')
      .maybeSingle();

    if (error) {
      console.error('[DEBUG-MILKY] CRITICAL: Settings table unreachable', error);
      return null;
    }

    if (!data || !data.pin_hash) {
      console.error(
        '[DEBUG-MILKY] CRITICAL: Settings table is empty or unreachable',
        { data }
      );
      return null;
    }

    return data.pin_hash;
  } catch (error) {
    console.error('[DEBUG-MILKY] Error loading stored PIN hash:', error);
    return null;
  }
}

export async function saveStoredPinHash(hash: string) {
  console.log('[DEBUG-MILKY] saveStoredPinHash() start');
  if (isBrowser()) {
    localStorage.setItem('pin_hash', hash);
    console.log('[DEBUG-MILKY] saveStoredPinHash localStorage updated');
  }

  if (!supabase) {
    console.warn('[DEBUG-MILKY] saveStoredPinHash supabase unavailable');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[DEBUG-MILKY] saveStoredPinHash error checking settings row:', error);
      return;
    }

    console.log('[DEBUG-MILKY] saveStoredPinHash settings row lookup', {
      rowFound: Boolean(data?.id),
      data,
    });

    if (data?.id) {
      await supabase.from('settings').update({ pin_hash: hash }).eq('id', data.id);
    } else {
      await supabase.from('settings').insert({
        shop_name: 'Meru Milk Collection',
        owner_name: 'Meru Manager',
        buying_rate: 55,
        selling_rate: 70,
        pin_hash: hash,
      });
    }
  } catch (error) {
    console.error('[DEBUG-MILKY] Error saving PIN hash to settings:', error);
  }
}
function convertDeliveryRow(row: Record<string, unknown>): MilkDelivery {
  return {
    id: String(row.id),
    farmer_id: String(row.farmer_id),
    date: String(row.date),
    litres:
      typeof row.litres === 'string'
        ? parseFloat(row.litres)
        : Number(row.litres),
    delivery_type: String(row.delivery_type) as MilkDelivery['delivery_type'],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    created_by: row.created_by ? String(row.created_by) : null,
  };
}

export async function fetchFarmers() {
  const localFarmers = await getLocalFarmers();

  if (!isOnline() || !supabase) {
    return localFarmers;
  }

  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .is('archived_at', null)
    .order('name');

  if (error || !data) {
    return localFarmers;
  }

  const farmers = data as Farmer[];

  await Promise.all(
    farmers.map((farmer) =>
      saveLocalFarmer({
        ...farmer,
        synced: true,
      })
    )
  );

  return farmers;
}

export async function fetchDeliveriesByDate(date: string) {
  const localDeliveries = await getLocalDeliveries(date);

  if (!isOnline() || !supabase) {
    return localDeliveries;
  }

  const { data, error } = await supabase
    .from('milk_deliveries')
    .select('*')
    .eq('date', date);

  if (error || !data) {
    return localDeliveries;
  }

  const remoteDeliveries = (data as Record<string, unknown>[]).map(
    (row) => convertDeliveryRow(row)
  );

  await Promise.all(
    remoteDeliveries.map((delivery) =>
      saveLocalDelivery({
        ...delivery,
        synced: true,
      })
    )
  );

  const merged = [
    ...remoteDeliveries,
    ...localDeliveries.filter(
      (delivery) =>
        !remoteDeliveries.some(
          (remote) =>
            remote.farmer_id === delivery.farmer_id &&
            remote.delivery_type === delivery.delivery_type &&
            remote.date === delivery.date
        )
    ),
  ];

  return merged;
}

export async function addFarmer(
  name: string,
  phone: string,
  eveningDeliveryEnabled: boolean,
  notes: string | null
) {
  const id = generateId();
  const farmer: LocalFarmer = {
    id,
    name,
    phone,
    active: true,
    evening_delivery_enabled: eveningDeliveryEnabled,
    notes,
    created_at: new Date().toISOString(),
    archived_at: null,
    synced: false,
  };

  await saveLocalFarmer(farmer);
  await addToSyncQueue({
    type: 'farmer',
    action: 'create',
    data: {
      name: farmer.name,
      phone: farmer.phone,
      active: farmer.active,
      evening_delivery_enabled: farmer.evening_delivery_enabled,
      notes: farmer.notes,
      created_at: farmer.created_at,
      archived_at: farmer.archived_at,
      local_id: farmer.id,
    },
  });

  if (isOnline()) {
    await syncPendingQueue();
  }

  return farmer;
}

export async function saveMilkDelivery(
  farmerId: string,
  litres: number,
  deliveryType: MilkDelivery['delivery_type'],
  date: string
) {
  const id = generateId();
  const delivery: LocalMilkDelivery = {
    id,
    farmer_id: farmerId,
    litres,
    delivery_type: deliveryType,
    date,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    synced: false,
  };

  await saveLocalDelivery(delivery);
  await addToSyncQueue({
    type: 'milk_delivery',
    action: 'create',
    data: {
      farmer_id: delivery.farmer_id,
      litres: delivery.litres,
      delivery_type: delivery.delivery_type,
      date: delivery.date,
      created_at: delivery.created_at,
      updated_at: delivery.updated_at,
      local_id: delivery.id,
    },
  });

  if (isOnline()) {
    await syncPendingQueue();
  }

  return delivery;
}

export async function updateMilkDelivery(deliveryId: string, litres: number) {
  const existing = await db.deliveries.get(deliveryId);

  if (!existing) {
    throw new Error('Delivery not found');
  }

  const updatedDelivery: LocalMilkDelivery = {
    ...existing,
    litres,
    updated_at: new Date().toISOString(),
    synced: false,
  };

  await saveLocalDelivery(updatedDelivery);
  await addToSyncQueue({
    type: 'milk_delivery',
    action: 'update',
    data: {
      farmer_id: updatedDelivery.farmer_id,
      litres: updatedDelivery.litres,
      delivery_type: updatedDelivery.delivery_type,
      date: updatedDelivery.date,
      updated_at: updatedDelivery.updated_at,
      local_id: updatedDelivery.id,
    },
  });

  if (isOnline()) {
    await syncPendingQueue();
  }

  return updatedDelivery;
}

export async function syncPendingQueue() {
  if (!isOnline() || !supabase) {
    return;
  }

  const pendingItems = await getPendingSyncItems();

  for (const item of pendingItems) {
    try {
      if (item.type === 'milk_delivery') {
        const data = item.data as {
          farmer_id: string;
          litres: number;
          delivery_type: MilkDelivery['delivery_type'];
          date: string;
          created_at?: string;
          updated_at: string;
          local_id?: string;
        };

        const { error } = await supabase.from('milk_deliveries').upsert(
          {
            farmer_id: data.farmer_id,
            litres: data.litres,
            delivery_type: data.delivery_type,
            date: data.date,
            created_at: data.created_at ?? new Date().toISOString(),
            updated_at: data.updated_at,
          },
          { onConflict: 'farmer_id,date,delivery_type' }
        );

        if (error) {
          throw error;
        }

        if (data.local_id) {
          await db.deliveries.where('id').equals(data.local_id).modify({
            synced: true,
          });
        }
      }

      if (item.type === 'farmer') {
        const data = item.data as {
          name: string;
          phone: string;
          active: boolean;
          evening_delivery_enabled: boolean;
          notes: string | null;
          created_at: string;
          archived_at: string | null;
          local_id?: string;
        };

        const { error } = await supabase.from('farmers').upsert(
          {
            name: data.name,
            phone: data.phone,
            active: data.active,
            evening_delivery_enabled: data.evening_delivery_enabled,
            notes: data.notes,
            created_at: data.created_at,
            archived_at: data.archived_at,
          },
          { onConflict: 'phone' }
        );

        if (error) {
          throw error;
        }

        if (data.local_id) {
          await db.farmers.where('id').equals(data.local_id).modify({
            synced: true,
          });
        }
      }

      await markSyncItemAsSynced(item.id);
    } catch (error) {
      console.error('Sync failed for item', item, error);
    }
  }
}
