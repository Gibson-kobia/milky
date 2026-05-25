import type {
  Farmer,
  LedgerEntry,
  MilkDelivery,
  Payment,
} from '@/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getMonthStartForDate } from '@/lib/utils';

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

function convertLedgerEntryRow(row: Record<string, unknown>): LedgerEntry {
  return {
    id: String(row.id),
    farmer_id: row.farmer_id ? String(row.farmer_id) : '',
    entry_type: String(row.entry_type) as LedgerEntry['entry_type'],
    amount_kes:
      typeof row.amount_kes === 'string'
        ? parseFloat(row.amount_kes)
        : Number(row.amount_kes),
    description: row.description ? String(row.description) : null,
    created_at: String(row.created_at),
    created_by: row.created_by ? String(row.created_by) : null,
    transaction_date: String(row.transaction_date),
    reference_id: row.reference_id ? String(row.reference_id) : null,
  };
}

function convertPaymentRow(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    farmer_id: String(row.farmer_id),
    amount:
      typeof row.amount === 'string' ? parseFloat(row.amount) : Number(row.amount),
    method: String(row.method) as Payment['method'],
    date: String(row.date),
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at),
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
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .is('archived_at', null)
    .order('name');
  if (error || !data) return [];
  return data as Farmer[];
}

export async function fetchFarmerById(farmerId: string): Promise<Farmer | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .eq('id', farmerId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Farmer;
}

export async function fetchDeliveriesByDate(date: string): Promise<MilkDelivery[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('milk_deliveries').select('*').eq('date', date);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(convertDeliveryRow);
}

export async function fetchDeliveriesInRange(
  startDate: string,
  endDate: string
): Promise<MilkDelivery[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('milk_deliveries')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(convertDeliveryRow);
}

export interface DailyDeliveryAggregate {
  day: string;
  totalLitres: number;
  totalFarmers: number;
}

export interface DailyAdvanceAggregate {
  day: string;
  totalAdvances: number;
}

export interface DailyCollectionSummary {
  day: string;
  totalLitres: number;
  totalFarmers: number;
  totalAdvances: number;
  totalPayout: number;
}

export interface MonthlySummaryView {
  month: string;
  totalLitres: number;
  totalFarmers: number;
  totalAdvances: number;
  totalPayout: number;
}

function convertDailySummaryRow(row: Record<string, unknown>): DailyCollectionSummary {
  return {
    day: String(row.report_date || row.day),
    totalLitres:
      typeof row.total_litres === 'string'
        ? parseFloat(row.total_litres)
        : Number(row.total_litres),
    totalFarmers:
      typeof row.total_farmers === 'string'
        ? parseFloat(row.total_farmers)
        : Number(row.total_farmers),
    totalAdvances:
      typeof row.total_advances === 'string'
        ? parseFloat(row.total_advances)
        : Number(row.total_advances),
    totalPayout:
      typeof row.total_payout === 'string'
        ? parseFloat(row.total_payout)
        : Number(row.total_payout),
  };
}

function convertMonthlySummaryRow(row: Record<string, unknown>): MonthlySummaryView {
  return {
    month: String(row.month),
    totalLitres:
      typeof row.total_litres === 'string'
        ? parseFloat(row.total_litres)
        : Number(row.total_litres),
    totalFarmers:
      typeof row.total_farmers === 'string'
        ? parseFloat(row.total_farmers)
        : Number(row.total_farmers),
    totalAdvances:
      typeof row.total_advances === 'string'
        ? parseFloat(row.total_advances)
        : Number(row.total_advances),
    totalPayout:
      typeof row.total_payout === 'string'
        ? parseFloat(row.total_payout)
        : Number(row.total_payout),
  };
}

export async function fetchDailyCollectionAggregates(
  startDate: string,
  endDate: string
): Promise<DailyCollectionSummary[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('daily_summary_view')
    .select('*')
    .gte('report_date', startDate)
    .lte('report_date', endDate)
    .order('report_date', { ascending: false });

  if (error || !data) return [];
  const rows = data as Record<string, unknown>[];
  return rows.map(convertDailySummaryRow);
}

export async function fetchDailySummaryByDate(
  date: string
): Promise<DailyCollectionSummary | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('daily_summary_view')
    .select('*')
    .eq('report_date', date)
    .maybeSingle();

  if (error || !data) return null;
  return convertDailySummaryRow(data as Record<string, unknown>);
}

export async function fetchMonthlySummaryByMonth(
  date: string
): Promise<MonthlySummaryView | null> {
  const supabase = getSupabaseClient();
  const monthStart = new Date(getMonthStartForDate(date));
  const monthStartString = monthStart.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('monthly_summary_view')
    .select('*')
    .eq('month', monthStartString)
    .maybeSingle();

  if (error || !data) return null;
  return convertMonthlySummaryRow(data as Record<string, unknown>);
}

export async function fetchDailyDeliveryAggregates(
  startDate: string,
  endDate: string
): Promise<DailyDeliveryAggregate[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('milk_deliveries')
    .select(
      "date_trunc('day', created_at) as day, sum(litres) as total_litres, count(distinct farmer_id) as total_farmers",
      { count: 'exact' }
    )
    .gte('date', startDate)
    .lte('date', endDate)
    .order('day', { ascending: false });

  if (error || !data) return [];
  const rows = data as unknown as Record<string, unknown>[];
  return rows.map((row) => ({
    day: String(row.day),
    totalLitres:
      typeof row.total_litres === 'string'
        ? parseFloat(row.total_litres)
        : Number(row.total_litres),
    totalFarmers:
      typeof row.total_farmers === 'string'
        ? parseFloat(row.total_farmers)
        : Number(row.total_farmers),
  }));
}

export async function fetchDailyAdvanceAggregates(
  startDate: string,
  endDate: string
): Promise<DailyAdvanceAggregate[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('ledger_entries')
    .select("date_trunc('day', transaction_date) as day, sum(amount_kes) as total_advances", {
      count: 'exact',
    })
    .in('entry_type', ['advance_cash', 'advance_goods'])
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('day', { ascending: false });

  if (error || !data) return [];
  const rows = data as unknown as Record<string, unknown>[];
  return rows.map((row) => ({
    day: String(row.day),
    totalAdvances:
      typeof row.total_advances === 'string'
        ? parseFloat(row.total_advances)
        : Number(row.total_advances),
  }));
}

export async function fetchDeliveriesForFarmer(
  farmerId: string,
  startDate: string,
  endDate: string
): Promise<MilkDelivery[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('milk_deliveries')
    .select('*')
    .eq('farmer_id', farmerId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(convertDeliveryRow);
}

export async function fetchLedgerEntriesInRange(
  startDate: string,
  endDate: string
): Promise<LedgerEntry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(convertLedgerEntryRow);
}

export async function fetchPaymentsInRange(
  startDate: string,
  endDate: string
): Promise<Payment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(convertPaymentRow);
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

  // Use upsert to deterministically create-or-update a single row
  const payload = {
    farmer_id: farmerId,
    litres,
    delivery_type: deliveryType,
    date,
    updated_at: new Date().toISOString(),
  } as Record<string, unknown>;

  const { data, error } = await supabase
    .from('milk_deliveries')
    .upsert(payload, { onConflict: 'farmer_id,date,delivery_type' })
    .select()
    .single();

  if (error) throw error;
  return convertDeliveryRow(data as Record<string, unknown>);
}

// Add ledger/advance insert helper
export function convertAdvanceRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    farmer_id: String(row.farmer_id),
    amount:
      typeof row.amount === 'string' ? parseFloat(row.amount) : Number(row.amount),
    date: String(row.date),
    note: row.note ? String(row.note) : null,
    created_at: String(row.created_at),
    created_by: row.created_by ? String(row.created_by) : null,
  };
}

export async function fetchAdvancesForFarmer(
  farmerId: string,
  startDate: string,
  endDate: string
): Promise<LedgerEntry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('farmer_id', farmerId)
    .in('entry_type', ['advance_cash', 'advance_goods'])
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(convertLedgerEntryRow);
}

export async function addAdvance(
  farmerId: string,
  amount: number,
  date: string,
  note: string | null = null
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('advances')
    .insert({
      farmer_id: farmerId,
      amount,
      date,
      note,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return convertAdvanceRow(data as Record<string, unknown>);
}

export async function addLedgerEntry(
  farmerId: string | null,
  entryType: string,
  amountKes: number,
  transactionDate: string,
  description: string | null = null
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('ledger_entries')
    .insert({
      farmer_id: farmerId,
      entry_type: entryType,
      amount_kes: amountKes,
      transaction_date: transactionDate,
      description,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return convertLedgerEntryRow(data as Record<string, unknown>);
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
  return;
}
