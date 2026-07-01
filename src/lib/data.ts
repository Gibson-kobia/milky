import type {
  Farmer,
  LedgerEntry,
  MilkDelivery,
  Payment,
} from '@/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getMonthStartForDate, validateMilkQuantity } from '@/lib/utils';

export const isBrowser = () => typeof window !== 'undefined';
export const isOnline = () => isBrowser() && window.navigator.onLine;

function convertDeliveryRow(row: Record<string, unknown>): MilkDelivery {
  // Safe numeric conversion
  const safeNumber = (val: unknown): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    return isNaN(num) ? 0 : num;
  };

  const parsedLitres = safeNumber(row.litres);
  console.log('[TRACE] convertDeliveryRow parsing DB row', {
    rawLitres: row.litres,
    rawLitresType: typeof row.litres,
    parsedLitres,
    parsedType: typeof parsedLitres,
    fractional: parsedLitres % 1,
    row,
  });

  return {
    id: String(row.id),
    farmer_id: String(row.farmer_id),
    date: String(row.date),
    litres: parsedLitres,
    delivery_type: String(row.delivery_type) as MilkDelivery['delivery_type'],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    created_by: row.created_by ? String(row.created_by) : null,
  };
}

function convertLedgerEntryRow(row: Record<string, unknown>): LedgerEntry {
  // Safe numeric conversion
  const safeNumber = (val: unknown): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    return isNaN(num) ? 0 : num;
  };

  return {
    id: String(row.id),
    farmer_id: row.farmer_id ? String(row.farmer_id) : '',
    entry_type: String(row.entry_type) as LedgerEntry['entry_type'],
    amount_kes: safeNumber(row.amount_kes),
    description: row.description ? String(row.description) : null,
    created_at: String(row.created_at),
    created_by: row.created_by ? String(row.created_by) : null,
    transaction_date: String(row.transaction_date),
    reference_id: row.reference_id ? String(row.reference_id) : null,
  };
}

function convertPaymentRow(row: Record<string, unknown>): Payment {
  // Safe numeric conversion
  const safeNumber = (val: unknown): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    return isNaN(num) ? 0 : num;
  };

  return {
    id: String(row.id),
    farmer_id: String(row.farmer_id),
    amount: safeNumber(row.amount),
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
  const deliveries = (data as Record<string, unknown>[]).map(convertDeliveryRow);
  console.log('[Milk Delivery] fetchDeliveriesByDate', {
    date,
    deliveries: deliveries.map((delivery) => ({
      id: delivery.id,
      litres: delivery.litres,
      formatted: String(delivery.litres),
    })),
  });
  return deliveries;
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
  const deliveries = (data as Record<string, unknown>[]).map(convertDeliveryRow);
  console.log('[Milk Delivery] fetchDeliveriesInRange', {
    startDate,
    endDate,
    deliveries: deliveries.map((delivery) => ({
      id: delivery.id,
      farmer_id: delivery.farmer_id,
      date: delivery.date,
      litres: delivery.litres,
      formattedLitres: String(delivery.litres),
      delivery_type: delivery.delivery_type,
    })),
  });
  return deliveries;
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
  // Safe numeric conversion - ensures no NaN is returned
  const safeNumber = (val: unknown): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    return isNaN(num) ? 0 : num;
  };

  const totalLitres = safeNumber(row.total_litres);
  console.log('[Milk Delivery] convertDailySummaryRow raw values', {
    rawTotal: row.total_litres,
    parsedTotal: totalLitres,
    formattedTotal: String(totalLitres),
  });

  return {
    day: String(row.report_date || row.day),
    totalLitres,
    totalFarmers: safeNumber(row.total_farmers),
    totalAdvances: safeNumber(row.total_advances),
    totalPayout: safeNumber(row.total_payout),
  };
}

function convertMonthlySummaryRow(row: Record<string, unknown>): MonthlySummaryView {
  // Safe numeric conversion - ensures no NaN is returned
  const safeNumber = (val: unknown): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    return isNaN(num) ? 0 : num;
  };

  const totalLitres = safeNumber(row.total_litres);
  console.log('[Milk Delivery] convertMonthlySummaryRow raw values', {
    rawTotal: row.total_litres,
    parsedTotal: totalLitres,
    formattedTotal: String(totalLitres),
  });

  return {
    month: String(row.month),
    totalLitres,
    totalFarmers: safeNumber(row.total_farmers),
    totalAdvances: safeNumber(row.total_advances),
    totalPayout: safeNumber(row.total_payout),
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
  const summaries = rows.map(convertDailySummaryRow);
  console.log('[Milk Delivery] fetchDailyCollectionAggregates', {
    startDate,
    endDate,
    summaries,
  });
  return summaries;
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
  const summary = convertDailySummaryRow(data as Record<string, unknown>);
  console.log('[Milk Delivery] fetchDailySummaryByDate', { date, summary });
  return summary;
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
  const monthlySummary = convertMonthlySummaryRow(data as Record<string, unknown>);
  console.log('[Milk Delivery] fetchMonthlySummaryByMonth', {
    date,
    monthStartString,
    monthlySummary,
  });
  return monthlySummary;
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

export async function fetchBuyingRate(): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('settings')
    .select('buying_rate')
    .maybeSingle();

  if (error || !data) return 55;
  return Number(data.buying_rate ?? 55);
}

export async function fetchMonthlyPayoutSummary(month: string): Promise<MonthlyPayoutSummary | null> {
  const supabase = getSupabaseClient();
  const monthStart = `${month}-01`;
  const year = Number(month.split('-')[0]);
  const monthNumber = Number(month.split('-')[1]);
  const nextMonthDate = new Date(Date.UTC(year, monthNumber, 1));
  const monthEnd = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, '0')}-01`;

  const [monthlySummaryResult, activeFarmersResult, paymentsResult] = await Promise.all([
    supabase.from('monthly_summary_view').select('*').eq('month', monthStart).maybeSingle(),
    supabase.from('farmers').select('id', { count: 'exact' }).is('archived_at', null).eq('active', true),
    supabase.from('payments').select('farmer_id').gte('date', monthStart).lt('date', monthEnd)
  ]);

  const monthlySummary = monthlySummaryResult.data as Record<string, unknown> | null;
  const activeFarmers = activeFarmersResult.count ?? 0;
  const payments = (paymentsResult.data as Array<Record<string, unknown>> | null) ?? [];
  const paidFarmerIds = new Set(payments.map((payment) => String(payment.farmer_id)));

  if (!monthlySummary) {
    return {
      month,
      totalLitres: 0,
      totalGrossPayout: 0,
      totalAdvances: 0,
      totalNetPayout: 0,
      activeFarmers,
      paidCount: paidFarmerIds.size,
      unpaidCount: activeFarmers - paidFarmerIds.size,
    };
  }

  const totalLitres = Number(monthlySummary.total_litres ?? 0);
  const totalAdvances = Number(monthlySummary.total_advances ?? 0);
  const totalNetPayout = Number(monthlySummary.total_payout ?? 0);
  const buyingRate = await fetchBuyingRate();
  const totalGrossPayout = Number((totalLitres * buyingRate).toFixed(2));

  return {
    month,
    totalLitres,
    totalGrossPayout,
    totalAdvances,
    totalNetPayout,
    activeFarmers,
    paidCount: paidFarmerIds.size,
    unpaidCount: Math.max(activeFarmers - paidFarmerIds.size, 0),
  };
}

export async function fetchMonthlyPayoutRows(month: string): Promise<MonthlyFarmerPayoutRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_monthly_payout_rows', { selected_month: month });
  if (error || !data) return [];
  return (data as MonthlyFarmerPayoutRow[]).map((row) => ({
    ...row,
    total_litres: Number(Number(row.total_litres ?? 0).toFixed(2)),
    gross_amount: Number(Number(row.gross_amount ?? 0).toFixed(2)),
    advances: Number(Number(row.advances ?? 0).toFixed(2)),
    net_amount: Number(Number(row.net_amount ?? 0).toFixed(2)),
    milk_rate: Number(Number(row.milk_rate ?? 0).toFixed(2)),
  }));
}

export async function fetchFarmerMonthlyStatement(
  farmerId: string,
  month: string
): Promise<FarmerMonthlyStatement | null> {
  const supabase = getSupabaseClient();
  const monthStart = `${month}-01`;
  const year = Number(month.split('-')[0]);
  const monthNumber = Number(month.split('-')[1]);
  const nextMonthDate = new Date(Date.UTC(year, monthNumber, 1));
  const monthEnd = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, '0')}-01`;

  const [farmerResult, deliveriesResult, advancesResult, paymentsResult] = await Promise.all([
    supabase.from('farmers').select('*').eq('id', farmerId).maybeSingle(),
    supabase.from('milk_deliveries').select('*').eq('farmer_id', farmerId).gte('date', monthStart).lt('date', monthEnd).order('date', { ascending: true }),
    supabase.from('ledger_entries').select('*').eq('farmer_id', farmerId).in('entry_type', ['advance_cash', 'advance_goods']).gte('transaction_date', monthStart).lt('transaction_date', monthEnd).order('transaction_date', { ascending: true }),
    supabase.from('payments').select('*').eq('farmer_id', farmerId).gte('date', monthStart).lt('date', monthEnd).maybeSingle(),
  ]);

  const farmer = farmerResult.data as Farmer | null;
  const deliveries = (deliveriesResult.data as MilkDelivery[] | null) ?? [];
  const advances = (advancesResult.data as LedgerEntry[] | null) ?? [];
  const payment = paymentsResult.data as Payment | null;

  if (!farmer) return null;

  const buyingRate = await fetchBuyingRate();
  const totalLitres = deliveries.reduce((sum, delivery) => sum + Number(delivery.litres ?? 0), 0);
  const grossAmount = Number((totalLitres * buyingRate).toFixed(2));
  const advancesAmount = advances.reduce((sum, entry) => sum + Number(entry.amount_kes ?? 0), 0);
  const netAmount = Number((grossAmount - advancesAmount).toFixed(2));

  return {
    farmer_id: farmer.id,
    farmer_name: farmer.name,
    month,
    total_litres: Number(totalLitres.toFixed(2)),
    gross_amount: grossAmount,
    advances: Number(advancesAmount.toFixed(2)),
    net_amount: netAmount,
    deliveries,
    advances_detail: advances,
    payment,
  };
}

export async function saveFarmerPayment(
  farmerId: string,
  amount: number,
  method: Payment['method'],
  date: string,
  notes: string | null = null
): Promise<Payment> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('payments')
    .insert({
      farmer_id: farmerId,
      amount,
      method,
      date,
      notes,
      created_at: new Date().toISOString(),
      created_by: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Payment;
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
  const deliveries = (data as Record<string, unknown>[]).map(convertDeliveryRow);
  console.log('[Milk Delivery] fetchDeliveriesForFarmer', {
    farmerId,
    startDate,
    endDate,
    deliveries: deliveries.map((delivery) => ({
      id: delivery.id,
      date: delivery.date,
      litres: delivery.litres,
      formatted: String(delivery.litres),
    })),
  });
  return deliveries;
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
      phone: phone?.trim() || null,
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
  console.log('[TRACE] saveMilkDelivery ENTRY', { farmerId, litres, litresType: typeof litres, fractional: litres % 1 });

  // Use upsert to deterministically create-or-update a single row
  // Validate before attempting to save - reject invalid fractional values
  if (!validateMilkQuantity(litres)) {
    console.log('[TRACE] saveMilkDelivery validation FAILED', { litres, fractional: litres % 1 });
    throw new Error('Invalid milk quantity - allowed fractional increments: 0, .25, .5, .75');
  }

  const finalValue = Number.isInteger(litres) ? String(litres) : litres.toFixed(2);
  console.log('[TRACE] saveMilkDelivery after toFixed', { litres, finalValue, finalValueType: typeof finalValue });

  const payload = {
    farmer_id: farmerId,
    // Store as a string with two decimal places to preserve exact decimal
    // representation when sending to Postgres numeric columns.
    litres: finalValue,
    delivery_type: deliveryType,
    date,
    updated_at: new Date().toISOString(),
  } as Record<string, unknown>;

  console.log('[TRACE] saveMilkDelivery sending to DB', payload);

  const { data, error } = await supabase
    .from('milk_deliveries')
    .upsert(payload, { onConflict: 'farmer_id,date,delivery_type' })
    .select()
    .single();

  console.log('[TRACE] saveMilkDelivery response from DB', { data, error, returnedLitres: data?.litres });

  if (error) throw error;
  return convertDeliveryRow(data as Record<string, unknown>);
}

// Add ledger/advance insert helper
export function convertAdvanceRow(row: Record<string, unknown>) {
  // Safe numeric conversion
  const safeNumber = (val: unknown): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    return isNaN(num) ? 0 : num;
  };

  return {
    id: String(row.id),
    farmer_id: String(row.farmer_id),
    amount: safeNumber(row.amount),
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
  console.log('[TRACE] updateMilkDelivery ENTRY', { deliveryId, litres, litresType: typeof litres, fractional: litres % 1 });

  // Validate before attempting to save - reject invalid fractional values
  if (!validateMilkQuantity(litres)) {
    console.log('[TRACE] updateMilkDelivery validation FAILED', { litres, fractional: litres % 1 });
    throw new Error('Invalid milk quantity - allowed fractional increments: 0, .25, .5, .75');
  }

  const finalValue = Number.isInteger(litres) ? String(litres) : litres.toFixed(2);
  console.log('[TRACE] updateMilkDelivery after toFixed', { litres, finalValue, finalValueType: typeof finalValue });

  const { data, error } = await supabase
    .from('milk_deliveries')
    .update({ litres: finalValue, updated_at: new Date().toISOString() })
    .eq('id', deliveryId)
    .select()
    .single();

  console.log('[TRACE] updateMilkDelivery response from DB', { data, error, returnedLitres: data?.litres });

  if (error) throw error;
  return convertDeliveryRow(data as Record<string, unknown>);
}

export async function syncPendingQueue() {
  return;
}
