import type { Farmer, MilkDelivery } from '@/types';
import { getSupabaseClient } from '@/lib/supabase/client';

export const isBrowser = () => typeof window !== 'undefined';
export const isOnline = () => isBrowser() && window.navigator.onLine;

function convertDeliveryRow(row: Record<string, unknown>): MilkDelivery {
  return {
    id: String(row.id),
    farmer_id: String(row.farmer_id),
    date: String(row.date),
    litres:
      typeof row.litres === 'string' ? parseFloat(row.litres) : Number(row.litres),
    delivery_type: String(row.delivery_type) as MilkDelivery['delivery_type'],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    created_by: row.created_by ? String(row.created_by) : null,
  };
}

export async function getStoredPinHash(): Promise<string | null> {
  if (isBrowser()) {
    const key = String('pin_hash') || '';
    const localHash = localStorage.getItem(key);
    if (localHash) return localHash;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('settings').select('pin_hash').maybeSingle();
  if (error || !data) return null;
  return data.pin_hash ?? null;
}

export async function saveStoredPinHash(hash: string) {
  if (isBrowser()) {
    const key = String('pin_hash') || '';
    localStorage.setItem(key, hash);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('settings').select('id').maybeSingle();
  if (error) return;

  if (data?.id) {
    await supabase.from('settings').update({ pin_hash: hash }).eq('id', data.id);
  } else {
    await supabase.from('settings').insert({
      shop_name: 'Milky Shop',
      owner_name: 'Owner',
      buying_rate: 55,
      selling_rate: 70,
      pin_hash: hash,
    });
  }
}

export async function fetchFarmers(): Promise<Farmer[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('farmers').select('*').is('archived_at', null).order('name');
  if (error || !data) return [];
  return data as Farmer[];
}

export async function fetchDeliveriesByDate(date: string): Promise<MilkDelivery[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('milk_deliveries').select('*').eq('date', date);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(convertDeliveryRow);
}

export async function addFarmer(
  name: string,
  phone: string,
  eveningDeliveryEnabled: boolean,
  notes: string | null
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('farmers')
    .insert({
      name,
      phone,
      evening_delivery_enabled: eveningDeliveryEnabled,
      notes,
      active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Farmer;
}

export async function saveMilkDelivery(
  farmerId: string,
  litres: number,
  deliveryType: MilkDelivery['delivery_type'],
  date: string
) {
  const supabase = getSupabaseClient();

  // prevent duplicate daily entries for same farmer/date/type
  const { data: existing } = await supabase
    .from('milk_deliveries')
    .select('id')
    .eq('farmer_id', farmerId)
    .eq('date', date)
    .eq('delivery_type', deliveryType)
    .maybeSingle();

  if (existing) {
    throw new Error('Delivery for this farmer/date/type already exists');
  }

  const { data, error } = await supabase
    .from('milk_deliveries')
    .insert({
      farmer_id: farmerId,
      litres,
      delivery_type: deliveryType,
      date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return convertDeliveryRow(data as Record<string, unknown>);
}

export async function updateMilkDelivery(deliveryId: string, litres: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('milk_deliveries')
    .update({ litres, updated_at: new Date().toISOString() })
    .eq('id', deliveryId)
    .select()
    .single();

  if (error) throw error;
  return convertDeliveryRow(data as Record<string, unknown>);
}

export async function syncPendingQueue() {
  // Previously this project used an IndexedDB-backed sync queue.
  // For now, syncing is handled directly in save/add APIs so this is a noop.
  return;
}
