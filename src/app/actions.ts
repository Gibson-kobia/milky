'use server';

import { getSupabaseClient } from '@/lib/supabase/client';

export async function addMilkDelivery(
  farmerId: string,
  litres: number,
  deliveryType: 'morning' | 'evening',
  date: string
) {
  console.log('[DEBUG-MILKY] addMilkDelivery()', {
    farmerId,
    litres,
    deliveryType,
    date,
  });

  try {
    const supabase = getSupabaseClient();
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

    return { success: true, data };
  } catch (error) {
    console.error('[DEBUG-MILKY] Error adding milk delivery:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to add delivery',
    };
  }
}

export async function updateMilkDelivery(
  deliveryId: string,
  litres: number
) {
  console.log('[DEBUG-MILKY] updateMilkDelivery()', { deliveryId, litres });
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('milk_deliveries')
      .update({
        litres,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('[DEBUG-MILKY] Error updating milk delivery:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update delivery',
    };
  }
}

export async function getTodayDeliveries(date: string) {
  console.log('[DEBUG-MILKY] getTodayDeliveries()', { date });
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('milk_deliveries')
      .select('*')
      .eq('date', date);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('[DEBUG-MILKY] Error fetching deliveries:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch deliveries',
    };
  }
}

export async function getFarmers() {
  console.log('[DEBUG-MILKY] getFarmers()');
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .is('archived_at', null)
      .order('name');

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('[DEBUG-MILKY] Error fetching farmers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch farmers',
    };
  }
}

export async function addFarmer(
  name: string,
  phone: string,
  eveningDeliveryEnabled: boolean,
  notes: string | null
) {
  console.log('[DEBUG-MILKY] addFarmer()', { name, phone, eveningDeliveryEnabled });
  try {
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

    return { success: true, data };
  } catch (error) {
    console.error('[DEBUG-MILKY] Error adding farmer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add farmer',
    };
  }
}

export async function getLedgerEntries(farmerId?: string) {
  console.log('[DEBUG-MILKY] getLedgerEntries()', { farmerId });
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('ledger_entries')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('[DEBUG-MILKY] Error fetching ledger:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch ledger',
    };
  }
}

export async function getMonthlySummaries(farmerId?: string) {
  console.log('[DEBUG-MILKY] getMonthlySummaries()', { farmerId });
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('monthly_summaries')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('[DEBUG-MILKY] Error fetching monthly summaries:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch summaries',
    };
  }
}
